import { NextRequest, NextResponse } from "next/server";
import { sanitizeAndValidateEmail } from "@/lib/email-validation";
import { emailOtpManager } from "@/lib/email-otp";
import { sendVerificationEmail } from "@/lib/email-service";
import { rateLimiter, getClientIp, RATE_LIMITS } from "@/lib/rate-limiter";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface SendEmailOtpRequestBody {
  email?: string;
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // 1. IP Rate Limiting Check
  const ipLimit = rateLimiter.checkLimit(
    `send_email_otp:ip:${clientIp}`,
    RATE_LIMITS.SEND_EMAIL_OTP.IP_MAX,
    RATE_LIMITS.SEND_EMAIL_OTP.IP_WINDOW_MS
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

  // 2. Parse & Validate JSON Request Body
  let body: SendEmailOtpRequestBody;
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

  const validation = sanitizeAndValidateEmail(body.email);
  if (!validation.isValid || !validation.email) {
    return NextResponse.json(
      {
        success: false,
        error: validation.error || "Please enter a valid email address.",
        code: "INVALID_EMAIL",
      },
      { status: 400 }
    );
  }

  const normalizedEmail = validation.email;

  // 3. Email Rate Limiting Check (Prevent email spam/abuse)
  const emailLimit = rateLimiter.checkLimit(
    `send_email_otp:email:${normalizedEmail}`,
    RATE_LIMITS.SEND_EMAIL_OTP.EMAIL_MAX,
    RATE_LIMITS.SEND_EMAIL_OTP.EMAIL_WINDOW_MS
  );

  if (!emailLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many verification code requests for this email. Please wait before requesting another.",
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

  // 4. Generate Cryptographically Secure 6-Digit OTP & Hash
  let generated: { otp: string; expiresAt: number; cooldownSeconds: number };
  try {
    generated = emailOtpManager.generateOtp(normalizedEmail);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Please wait before requesting another code.",
        code: "RESEND_COOLDOWN_ACTIVE",
      },
      { status: 429 }
    );
  }

  // 5. Send OTP via Transactional Email Service
  const emailResult = await sendVerificationEmail({
    to: normalizedEmail,
    otpCode: generated.otp,
  });

  if (!emailResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: emailResult.error || "Failed to deliver verification email. Please try again.",
        code: "EMAIL_DELIVERY_FAILED",
      },
      { status: 500 }
    );
  }

  // 6. Check existing user state
  const existingUser = db.findUserByEmail(normalizedEmail);
  const isExistingUser = !!existingUser;

  // 7. Return Secure Sanitized Response (includes dev helper only in local development when unconfigured)
  const isDevWithoutResend =
    process.env.NODE_ENV !== "production" &&
    (!process.env.RESEND_API_KEY || !process.env.RESEND_API_KEY.startsWith("re_"));

  return NextResponse.json(
    {
      success: true,
      message: isDevWithoutResend
        ? "Development Mode: Verification code generated and logged."
        : "Verification code sent to your email address.",
      isExistingUser,
      cooldownSeconds: generated.cooldownSeconds,
      ...(isDevWithoutResend ? { devOtp: generated.otp } : {}),
    },
    {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": String(emailLimit.remaining),
      },
    }
  );
}
