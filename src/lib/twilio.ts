// @ts-nocheck
import twilio from "twilio";

/**
 * Validates and retrieves required Twilio credentials from environment variables.
 * Ensures secrets are never exposed and missing configurations fail fast.
 */
export function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    const missing = [
      !accountSid && "TWILIO_ACCOUNT_SID",
      !authToken && "TWILIO_AUTH_TOKEN",
      !verifyServiceSid && "TWILIO_VERIFY_SERVICE_SID",
    ].filter(Boolean);

    throw new Error(
      `Twilio Verify service is not configured. Missing environment variables: ${missing.join(", ")}`
    );
  }

  return {
    accountSid,
    authToken,
    verifyServiceSid,
  };
}

/**
 * Singleton instance of Twilio REST Client
 */
let cachedClient: twilio.Twilio | null = null;

export function getTwilioClient(): twilio.Twilio {
  if (!cachedClient) {
    const { accountSid, authToken } = getTwilioConfig();
    cachedClient = twilio(accountSid, authToken, {
      lazyLoading: true,
    });
  }
  return cachedClient;
}

export interface TwilioServiceError {
  status: number;
  message: string;
  code?: number | string;
}

/**
 * Maps Twilio API error codes to secure, client-friendly messages and appropriate HTTP status codes.
 * Ensures internal credentials, tokens, or raw stack traces are NEVER leaked to the client.
 */
export function mapTwilioError(error: any): TwilioServiceError {
  // Check if it's a known Twilio Error
  const errorCode = error?.code || error?.status;
  const errorMsg = error?.message || "";

  // Log internal error safely on the server for diagnostics
  console.error("[Twilio Verify Service Error]", {
    code: error?.code,
    status: error?.status,
    message: errorMsg,
    moreInfo: error?.moreInfo,
  });

  switch (errorCode) {
    case 60200: // Invalid parameter (e.g. invalid phone number)
    case 21211: // Invalid 'To' Phone Number
      return {
        status: 400,
        message: "The provided phone number is invalid. Please check the country code and number.",
        code: "INVALID_PHONE_NUMBER",
      };

    case 60202: // Max verification check attempts reached
      return {
        status: 429,
        message: "Maximum verification attempts exceeded. Please request a new verification code.",
        code: "MAX_CHECK_ATTEMPTS_EXCEEDED",
      };

    case 60203: // Max send attempts reached
    case 20429: // Twilio rate limit reached
      return {
        status: 429,
        message: "Too many SMS requests sent to this number. Please wait a few minutes before retrying.",
        code: "RATE_LIMIT_EXCEEDED",
      };

    case 60205: // Channel SMS is not supported for the provided phone number (e.g., landline)
      return {
        status: 400,
        message: "SMS delivery is not supported for this phone number (e.g., landline or non-SMS line).",
        code: "SMS_NOT_SUPPORTED",
      };

    case 20003: // Authentication failed with Twilio
      return {
        status: 500,
        message: "Verification service authentication failure. Please contact system administrator.",
        code: "SERVICE_CONFIG_ERROR",
      };

    case 20404: // Verification not found or expired
      return {
        status: 400,
        message: "Verification code has expired or was not found. Please request a new code.",
        code: "VERIFICATION_NOT_FOUND",
      };

    default:
      if (error?.message?.includes("Missing environment variables")) {
        return {
          status: 500,
          message: "SMS authentication service is not properly configured.",
          code: "CONFIG_ERROR",
        };
      }
      return {
        status: 500,
        message: "Unable to process SMS verification at this time. Please try again later.",
        code: "INTERNAL_SERVICE_ERROR",
      };
  }
}
