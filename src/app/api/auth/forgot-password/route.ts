import { NextRequest, NextResponse } from "next/server";
import { sanitizeAndValidateEmail } from "@/lib/email-validation";
import { emailOtpManager } from "@/lib/email-otp";
import { sendVerificationEmail } from "@/lib/email-service";
import { rateLimiter, getClientIp, RATE_LIMITS } from "@/lib/rate-limiter";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ForgotPasswordRequestBody {
  email?: string;
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // 1. IP Rate Limiting Check
  const ipLimit = rateLimiter.checkLimit(
    `forgot_password:ip:${clientIp}`,
    RATE_LIMITS.SEND_EMAIL_OTP.IP_MAX,
    RATE_LIMITS.SEND_EMAIL_OTP.IP_WINDOW_MS
  );

  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many password reset requests from this IP. Please try again later.",
        code: "IP_RATE_LIMITED",
        retryAfter: ipLimit.resetInSeconds,
      },
      { status: 429, headers: { "Retry-After": String(ipLimit.resetInSeconds) } }
    );
  }

  // 2. Parse request payload
  let body: ForgotPasswordRequestBody;
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

  // 4. Email Rate Limiting Check
  const emailLimit = rateLimiter.checkLimit(
    `forgot_password:email:${normalizedEmail}`,
    RATE_LIMITS.SEND_EMAIL_OTP.EMAIL_MAX,
    RATE_LIMITS.SEND_EMAIL_OTP.EMAIL_WINDOW_MS
  );

  if (!emailLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many password reset requests for this email. Please wait before requesting another.",
        code: "EMAIL_RATE_LIMITED",
        retryAfter: emailLimit.resetInSeconds,
      },
      { status: 429, headers: { "Retry-After": String(emailLimit.resetInSeconds) } }
    );
  }

  // 5. Look up user
  const user = db.findUserByEmail(normalizedEmail);

  // If user does not exist, return generic success to prevent account enumeration
  if (!user) {
    return NextResponse.json(
      {
        success: true,
        message: "If an account with this email address exists, a 6-digit verification code has been sent.",
        email: normalizedEmail,
        cooldownSeconds: 60,
      },
      { status: 200 }
    );
  }

  // 6. Generate OTP
  let generatedOtp: { otp: string; expiresAt: number; cooldownSeconds: number };
  try {
    generatedOtp = emailOtpManager.generateOtp(normalizedEmail);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Please wait before requesting another reset code.",
        code: "RESEND_COOLDOWN_ACTIVE",
      },
      { status: 429 }
    );
  }

  // 7. Send Reset Email via Gmail SMTP
  const emailResult = await sendVerificationEmail({
    to: normalizedEmail,
    otpCode: generatedOtp.otp,
  });

  return NextResponse.json(
    {
      success: true,
      message: "A 6-digit password reset code has been sent to your registered email address.",
      email: normalizedEmail,
      cooldownSeconds: generatedOtp.cooldownSeconds,
      devOtp: process.env.NODE_ENV !== "production" && !emailResult.success ? generatedOtp.otp : undefined,
    },
    { status: 200 }
  );
}
