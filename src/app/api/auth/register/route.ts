import { NextRequest, NextResponse } from "next/server";
import { sanitizeAndValidateEmail } from "@/lib/email-validation";
import { emailOtpManager } from "@/lib/email-otp";
import { sendVerificationEmail } from "@/lib/email-service";
import { rateLimiter, getClientIp, RATE_LIMITS } from "@/lib/rate-limiter";
import { db } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

interface RegisterRequestBody {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  phone?: string;
  organization?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  wardId?: number;
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // 1. IP Rate Limiting Check
  const ipLimit = rateLimiter.checkLimit(
    `register:ip:${clientIp}`,
    RATE_LIMITS.SEND_EMAIL_OTP.IP_MAX,
    RATE_LIMITS.SEND_EMAIL_OTP.IP_WINDOW_MS
  );

  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many registration attempts from this IP. Please try again later.",
        code: "IP_RATE_LIMITED",
        retryAfter: ipLimit.resetInSeconds,
      },
      { status: 429, headers: { "Retry-After": String(ipLimit.resetInSeconds) } }
    );
  }

  // 2. Parse request payload
  let body: RegisterRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON request payload.", code: "INVALID_REQUEST_BODY" },
      { status: 400 }
    );
  }

  // 3. Name validation
  const name = body.name?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json(
      { success: false, error: "Please enter your full name.", code: "INVALID_NAME" },
      { status: 400 }
    );
  }

  // 4. Email validation
  const emailValidation = sanitizeAndValidateEmail(body.email);
  if (!emailValidation.isValid || !emailValidation.email) {
    return NextResponse.json(
      { success: false, error: emailValidation.error || "Please enter a valid email address.", code: "INVALID_EMAIL" },
      { status: 400 }
    );
  }
  const normalizedEmail = emailValidation.email;

  // 5. Password & Confirm Password validation
  const password = body.password || "";
  const confirmPassword = body.confirmPassword || "";

  if (!password) {
    return NextResponse.json(
      { success: false, error: "Please enter a password.", code: "MISSING_PASSWORD" },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { success: false, error: "Passwords do not match.", code: "PASSWORD_MISMATCH" },
      { status: 400 }
    );
  }

  const passwordStrength = validatePasswordStrength(password);
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

  // 6. Role validation (CRITICAL SECURITY RULE: No self-registration as ADMIN)
  let requestedRole: Role = "CITIZEN";
  const rawRole = (body.role || "").toUpperCase();
  if (rawRole === "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        error: "Administrator accounts cannot be self-registered. Please contact an existing administrator.",
        code: "ADMIN_REGISTRATION_FORBIDDEN",
      },
      { status: 403 }
    );
  } else if (rawRole === "OFFICER" || rawRole === "AUTHORITY") {
    requestedRole = "OFFICER";
  } else {
    requestedRole = "CITIZEN";
  }

  // 7. Validate Authority / Officer specific fields
  let organization = body.organization?.trim();
  let department = body.department?.trim();
  let designation = body.designation?.trim();
  let employeeId = body.employeeId?.trim();

  if (requestedRole === "OFFICER") {
    if (!organization) organization = "Municipal Corporation";
    if (!department) department = "Civic Works & Maintenance";
    if (!designation) designation = "Ward Official";
  }

  // 8. Check existing user state
  const existingUser = db.findUserByEmail(normalizedEmail);
  if (existingUser && existingUser.emailVerified && existingUser.passwordHash) {
    return NextResponse.json(
      {
        success: false,
        error: "An account with this email address already exists. Please sign in or reset your password.",
        code: "USER_ALREADY_EXISTS",
      },
      { status: 409 }
    );
  }

  // 9. Generate Password Hash & Create/Update User in unverified state
  const passwordHash = hashPassword(password);

  db.createUser({
    name,
    email: normalizedEmail,
    passwordHash,
    phone: body.phone?.trim(),
    role: requestedRole,
    emailVerified: false,
    authorityStatus: requestedRole === "OFFICER" ? "PENDING" : undefined,
    organization,
    department,
    designation,
    employeeId,
    wardId: body.wardId,
  });

  // 10. Generate Email Verification OTP
  let generatedOtp: { otp: string; expiresAt: number; cooldownSeconds: number };
  try {
    generatedOtp = emailOtpManager.generateOtp(normalizedEmail);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Please wait before requesting another verification code.",
        code: "RESEND_COOLDOWN_ACTIVE",
      },
      { status: 429 }
    );
  }

  // 11. Send Email Verification Code via Gmail SMTP
  const emailResult = await sendVerificationEmail({
    to: normalizedEmail,
    otpCode: generatedOtp.otp,
  });

  // Return sanitized response
  return NextResponse.json(
    {
      success: true,
      message: "Registration started. Please check your email for a 6-digit verification code.",
      email: normalizedEmail,
      role: requestedRole,
      cooldownSeconds: generatedOtp.cooldownSeconds,
      devOtp: process.env.NODE_ENV !== "production" && !emailResult.success ? generatedOtp.otp : undefined,
    },
    { status: 201 }
  );
}
