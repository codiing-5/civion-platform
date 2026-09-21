import { NextRequest, NextResponse } from "next/server";
import { getTwilioClient, getTwilioConfig, mapTwilioError } from "@/lib/twilio";
import { sanitizeAndValidateE164 } from "@/lib/phone-validation";
import { rateLimiter, getClientIp, RATE_LIMITS } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

interface SendOtpRequestBody {
  phoneNumber?: string;
  phone?: string; // Fallback alias
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // 1. IP Rate Limiting Check
  const ipLimit = rateLimiter.checkLimit(
    `send_otp:ip:${clientIp}`,
    RATE_LIMITS.SEND_OTP.IP_MAX,
    RATE_LIMITS.SEND_OTP.IP_WINDOW_MS
  );

  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many verification requests from this IP. Please try again later.",
        code: "IP_RATE_LIMITED",
        retryAfter: ipLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(ipLimit.resetInSeconds),
        },
      }
    );
  }

  // 2. Parse and Validate Request Body
  let body: SendOtpRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON request body.",
        code: "INVALID_REQUEST_BODY",
      },
      { status: 400 }
    );
  }

  const rawPhone = body.phoneNumber || body.phone;
  if (!rawPhone) {
    return NextResponse.json(
      {
        success: false,
        error: "Phone number is required in the request payload.",
        code: "MISSING_PHONE_NUMBER",
      },
      { status: 400 }
    );
  }

  // 3. Strict E.164 Validation and Sanitization
  const validation = sanitizeAndValidateE164(rawPhone);
  if (!validation.isValid || !validation.e164) {
    return NextResponse.json(
      {
        success: false,
        error: validation.error || "Invalid phone number format. Must be in standard E.164 format.",
        code: "INVALID_PHONE_FORMAT",
      },
      { status: 400 }
    );
  }

  const formattedPhone = validation.e164;

  // 4. Per-Phone Rate Limiting Check (Prevent SMS flooding / abuse)
  const phoneLimit = rateLimiter.checkLimit(
    `send_otp:phone:${formattedPhone}`,
    RATE_LIMITS.SEND_OTP.PHONE_MAX,
    RATE_LIMITS.SEND_OTP.PHONE_WINDOW_MS
  );

  if (!phoneLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many OTP requests for this phone number. Please wait before requesting another code.",
        code: "PHONE_RATE_LIMITED",
        retryAfter: phoneLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(phoneLimit.resetInSeconds),
        },
      }
    );
  }

  // 5. Outbound Twilio Verify API Call
  try {
    const { verifyServiceSid } = getTwilioConfig();
    const client = getTwilioClient();

    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: formattedPhone,
        channel: "sms",
      });

    // 6. Return Sanitized Response
    return NextResponse.json(
      {
        success: true,
        to: formattedPhone,
        status: verification.status, // e.g. "pending"
        message: "Verification code sent successfully via SMS.",
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Remaining": String(phoneLimit.remaining),
        },
      }
    );
  } catch (error: any) {
    const mapped = mapTwilioError(error);
    return NextResponse.json(
      {
        success: false,
        error: mapped.message,
        code: mapped.code,
      },
      { status: mapped.status }
    );
  }
}
