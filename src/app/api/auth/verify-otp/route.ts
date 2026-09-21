import { NextRequest, NextResponse } from "next/server";
import { getTwilioClient, getTwilioConfig, mapTwilioError } from "@/lib/twilio";
import { sanitizeAndValidateE164, validateOtpCode } from "@/lib/phone-validation";
import { rateLimiter, getClientIp, RATE_LIMITS } from "@/lib/rate-limiter";
import { db } from "@/lib/db";
import { signRoleToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface VerifyOtpRequestBody {
  phoneNumber?: string;
  phone?: string;
  otpCode?: string;
  code?: string;
  fullName?: string;
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // 1. IP Rate Limiting Check
  const ipLimit = rateLimiter.checkLimit(
    `verify_otp:ip:${clientIp}`,
    RATE_LIMITS.VERIFY_OTP.IP_MAX,
    RATE_LIMITS.VERIFY_OTP.IP_WINDOW_MS
  );

  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many verification attempts from this IP. Please try again later.",
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
  let body: VerifyOtpRequestBody;
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
  const rawCode = body.otpCode || body.code;

  if (!rawPhone) {
    return NextResponse.json(
      {
        success: false,
        error: "Phone number is required.",
        code: "MISSING_PHONE_NUMBER",
      },
      { status: 400 }
    );
  }

  if (!rawCode) {
    return NextResponse.json(
      {
        success: false,
        error: "Verification code is required.",
        code: "MISSING_OTP_CODE",
      },
      { status: 400 }
    );
  }

  // 3. Strict Phone Number Validation (E.164)
  const phoneValidation = sanitizeAndValidateE164(rawPhone);
  if (!phoneValidation.isValid || !phoneValidation.e164) {
    return NextResponse.json(
      {
        success: false,
        error: phoneValidation.error || "Invalid phone number format.",
        code: "INVALID_PHONE_FORMAT",
      },
      { status: 400 }
    );
  }

  const formattedPhone = phoneValidation.e164;

  // 4. Strict OTP Code Validation (Must be 6 digits before hitting outbound Twilio API)
  const otpValidation = validateOtpCode(rawCode);
  if (!otpValidation.isValid || !otpValidation.cleanCode) {
    return NextResponse.json(
      {
        success: false,
        error: otpValidation.error || "The verification code must be exactly 6 numeric digits.",
        code: "INVALID_OTP_FORMAT",
      },
      { status: 400 }
    );
  }

  const cleanOtpCode = otpValidation.cleanCode;

  // 5. Per-Phone Rate Limiting Check (Prevent brute-forcing OTPs)
  const phoneLimit = rateLimiter.checkLimit(
    `verify_otp:phone:${formattedPhone}`,
    RATE_LIMITS.VERIFY_OTP.PHONE_MAX,
    RATE_LIMITS.VERIFY_OTP.PHONE_WINDOW_MS
  );

  if (!phoneLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Maximum verification attempts exceeded for this phone number. Please request a new code.",
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

  // 6. Outbound Twilio Verify API Call
  try {
    const { verifyServiceSid } = getTwilioConfig();
    const client = getTwilioClient();

    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: formattedPhone,
        code: cleanOtpCode,
      });

    // 7. Verify Approval Status
    if (verificationCheck.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          status: verificationCheck.status, // "pending" / "canceled"
          error: "Invalid or expired verification code.",
          code: "INVALID_VERIFICATION_CODE",
        },
        { status: 400 }
      );
    }

    // 8. Authentication Success: Find or Provision User & Issue JWT Session Token
    let user = db.findUserByPhone(formattedPhone);

    if (!user) {
      const citizenName =
        body.fullName?.trim() || `Citizen ${formattedPhone.slice(-4)}`;
      user = db.createUser({
        phone: formattedPhone,
        name: citizenName,
      });
    } else if (body.fullName?.trim() && user.name.startsWith("Citizen ")) {
      user.name = body.fullName.trim();
    }

    const sessionToken = signRoleToken(user);

    return NextResponse.json(
      {
        success: true,
        status: "approved",
        message: "Phone number successfully verified.",
        token: sessionToken,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          wardId: user.wardId,
        },
      },
      { status: 200 }
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
