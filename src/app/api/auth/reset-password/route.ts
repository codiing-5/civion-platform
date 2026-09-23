import { NextRequest, NextResponse } from "next/server";
import { sanitizeAndValidateEmail, validateOtpCode } from "@/lib/email-validation";
import { emailOtpManager } from "@/lib/email-otp";
import { rateLimiter, getClientIp, RATE_LIMITS } from "@/lib/rate-limiter";
import { db } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ResetPasswordRequestBody {
  email?: string;
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // 1. IP Rate Limiting Check
  const ipLimit = rateLimiter.checkLimit(
    `reset_password:ip:${clientIp}`,
    RATE_LIMITS.VERIFY_EMAIL_OTP.IP_MAX,
    RATE_LIMITS.VERIFY_EMAIL_OTP.IP_WINDOW_MS
  );

  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many reset attempts from this IP. Please try again later.",
        code: "IP_RATE_LIMITED",
        retryAfter: ipLimit.resetInSeconds,
      },
      { status: 429, headers: { "Retry-After": String(ipLimit.resetInSeconds) } }
    );
  }

  // 2. Parse request payload
  let body: ResetPasswordRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON request payload.", code: "INVALID_REQUEST_BODY" },
      { status: 400 }
    );
  }

  // 3. Email validation
  const emailValidation = sanitizeAndValidateEmail(body.email);
  if (!emailValidation.isValid || !emailValidation.email) {
    return NextResponse.json(
      { success: false, error: emailValidation.error || "Please enter a valid email address.", code: "INVALID_EMAIL" },
      { status: 400 }
    );
  }
  const normalizedEmail = emailValidation.email;

  // 4. OTP format validation
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

  // 5. Password & Confirm Password validation
  const newPassword = body.newPassword || "";
  const confirmPassword = body.confirmPassword || "";

  if (!newPassword) {
    return NextResponse.json(
      { success: false, error: "Please enter a new password.", code: "MISSING_PASSWORD" },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { success: false, error: "Passwords do not match.", code: "PASSWORD_MISMATCH" },
      { status: 400 }
    );
  }

  const passwordStrength = validatePasswordStrength(newPassword);
  if (!passwordStrength.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: `Please choose a stronger password: ${passwordStrength.feedback.join(", ")}.`,
        code: "WEAK_PASSWORD",
        feedback: passwordStrength.feedback,
      },
      { status: 400 }
    );
  }

  // 6. Verify OTP
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

  // 7. Find and update user in data store
  const user = db.findUserByEmail(normalizedEmail);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to find the associated account. Please try registering.",
        code: "USER_NOT_FOUND",
      },
      { status: 404 }
    );
  }

  const newHash = hashPassword(newPassword);
  db.updateUser(user.id, {
    passwordHash: newHash,
    emailVerified: true,
  });

  return NextResponse.json(
    {
      success: true,
      message: "Password successfully updated! You can now sign in with your new password.",
    },
    { status: 200 }
  );
}
