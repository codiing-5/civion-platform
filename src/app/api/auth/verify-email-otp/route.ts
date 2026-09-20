import { NextRequest, NextResponse } from "next/server";
import { sanitizeAndValidateEmail, validateOtpCode } from "@/lib/email-validation";
import { emailOtpManager } from "@/lib/email-otp";
import { rateLimiter, getClientIp, RATE_LIMITS } from "@/lib/rate-limiter";
import { db } from "@/lib/db";
import { signRoleToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface VerifyEmailOtpRequestBody {
  email?: string;
  otp?: string;
  fullName?: string;
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // 1. IP Rate Limiting Check
  const ipLimit = rateLimiter.checkLimit(
    `verify_email_otp:ip:${clientIp}`,
    RATE_LIMITS.VERIFY_EMAIL_OTP.IP_MAX,
    RATE_LIMITS.VERIFY_EMAIL_OTP.IP_WINDOW_MS
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

  // 2. Parse & Validate JSON Request Body
  let body: VerifyEmailOtpRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON request payload.",
        code: "INVALID_REQUEST_BODY",
      },
      { status: 400 }
    );
  }

  const emailValidation = sanitizeAndValidateEmail(body.email);
  if (!emailValidation.isValid || !emailValidation.email) {
    return NextResponse.json(
      {
        success: false,
        error: emailValidation.error || "Please enter a valid email address.",
        code: "INVALID_EMAIL",
      },
      { status: 400 }
    );
  }

  const normalizedEmail = emailValidation.email;

  const otpValidation = validateOtpCode(body.otp);
  if (!otpValidation.isValid || !otpValidation.cleanCode) {
    return NextResponse.json(
      {
        success: false,
        error: otpValidation.error || "Verification code must be exactly 6 numeric digits.",
        code: "INVALID_OTP_FORMAT",
      },
      { status: 400 }
    );
  }

  const cleanOtpCode = otpValidation.cleanCode;

  // 3. Email Rate Limiting Check (Prevent brute-forcing OTP)
  const emailLimit = rateLimiter.checkLimit(
    `verify_email_otp:email:${normalizedEmail}`,
    RATE_LIMITS.VERIFY_EMAIL_OTP.EMAIL_MAX,
    RATE_LIMITS.VERIFY_EMAIL_OTP.EMAIL_WINDOW_MS
  );

  if (!emailLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Maximum verification attempts exceeded for this email. Please request a new code.",
        code: "EMAIL_RATE_LIMITED",
        retryAfter: emailLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(emailLimit.resetInSeconds),
        },
      }
    );
  }

  // 4. Verify OTP against stored cryptographic hash
  const verification = emailOtpManager.verifyOtp(normalizedEmail, cleanOtpCode);

  if (!verification.success) {
    const statusCode = verification.code === "MAX_ATTEMPTS_EXCEEDED" ? 429 : 400;
    return NextResponse.json(
      {
        success: false,
        error: verification.error || "Invalid or expired verification code.",
        code: verification.code,
        remainingAttempts: verification.remainingAttempts,
      },
      { status: statusCode }
    );
  }

  // 5. Provision / Find User in Civion Data Store
  let user = db.findUserByEmail(normalizedEmail);

  if (!user) {
    // New citizen account registration
    const citizenName =
      body.fullName?.trim() ||
      normalizedEmail.split("@")[0].replace(/[\._\-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    user = db.createUser({
      email: normalizedEmail,
      name: citizenName,
      role: "CITIZEN",
    });
  } else if (body.fullName?.trim() && (!user.name || user.name.startsWith("Citizen ") || user.name === normalizedEmail.split("@")[0])) {
    user.name = body.fullName.trim();
  }

  // 6. Sign Scoped JWT Session Token
  const sessionToken = signRoleToken(user);

  // 7. Create Response with HttpOnly Cookie
  const response = NextResponse.json(
    {
      success: true,
      message: "Email address successfully verified.",
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        wardId: user.wardId,
      },
    },
    { status: 200 }
  );

  // Set secure HttpOnly cookie for SSR/Middleware protection
  const isProd = process.env.NODE_ENV === "production";
  response.cookies.set("civion_token", sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}
