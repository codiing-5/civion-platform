import { NextRequest, NextResponse } from "next/server";
import { sanitizeAndValidateEmail } from "@/lib/email-validation";
import { rateLimiter, getClientIp, RATE_LIMITS } from "@/lib/rate-limiter";
import { db } from "@/lib/db";
import { verifyPassword, signRoleToken, sanitizeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface LoginRequestBody {
  email?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // 1. IP Rate Limiting Check
  const ipLimit = rateLimiter.checkLimit(
    `login:ip:${clientIp}`,
    RATE_LIMITS.VERIFY_EMAIL_OTP.IP_MAX,
    RATE_LIMITS.VERIFY_EMAIL_OTP.IP_WINDOW_MS
  );

  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many login attempts from this IP. Please try again later.",
        code: "IP_RATE_LIMITED",
        retryAfter: ipLimit.resetInSeconds,
      },
      { status: 429, headers: { "Retry-After": String(ipLimit.resetInSeconds) } }
    );
  }

  // 2. Parse request payload
  let body: LoginRequestBody;
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

  // 4. Password presence
  const password = body.password || "";
  if (!password) {
    return NextResponse.json(
      { success: false, error: "Please enter your password.", code: "MISSING_PASSWORD" },
      { status: 400 }
    );
  }

  // 5. Account rate limiting (per-email)
  const emailLimit = rateLimiter.checkLimit(
    `login:email:${normalizedEmail}`,
    RATE_LIMITS.VERIFY_EMAIL_OTP.EMAIL_MAX,
    RATE_LIMITS.VERIFY_EMAIL_OTP.EMAIL_WINDOW_MS
  );

  if (!emailLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many login attempts for this account. Please wait before trying again.",
        code: "EMAIL_RATE_LIMITED",
        retryAfter: emailLimit.resetInSeconds,
      },
      { status: 429, headers: { "Retry-After": String(emailLimit.resetInSeconds) } }
    );
  }

  // 6. Find User in Data Store
  const user = db.findUserByEmail(normalizedEmail);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: "Email or password is incorrect.",
        code: "INVALID_CREDENTIALS",
      },
      { status: 401 }
    );
  }

  // 7. Check if user is a legacy OTP account without a password
  if (!user.passwordHash) {
    return NextResponse.json(
      {
        success: false,
        error: "This account was created with email OTP. Please set up a password to continue.",
        code: "LEGACY_OTP_MIGRATION_REQUIRED",
        email: normalizedEmail,
      },
      { status: 403 }
    );
  }

  // 8. Verify Password
  const isPasswordValid = verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return NextResponse.json(
      {
        success: false,
        error: "Email or password is incorrect.",
        code: "INVALID_CREDENTIALS",
      },
      { status: 401 }
    );
  }

  // 9. Check Email Verification status
  if (user.emailVerified === false) {
    return NextResponse.json(
      {
        success: false,
        error: "Please verify your email address before signing in.",
        code: "UNVERIFIED_EMAIL",
        email: normalizedEmail,
      },
      { status: 403 }
    );
  }

  // 10. Check Authority approval status
  if (user.role === "OFFICER") {
    if (user.authorityStatus === "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: "Your authority account is awaiting administrator approval.",
          code: "PENDING_AUTHORITY_APPROVAL",
          authorityDetails: {
            organization: user.organization,
            department: user.department,
            designation: user.designation,
          },
        },
        { status: 403 }
      );
    }

    if (user.authorityStatus === "REJECTED") {
      return NextResponse.json(
        {
          success: false,
          error: "Your authority application was not approved. Please contact the administrator.",
          code: "AUTHORITY_APPLICATION_REJECTED",
        },
        { status: 403 }
      );
    }
  }

  // 11. Sign Scoped JWT Session Token
  const sessionToken = signRoleToken(user);
  const safeUser = sanitizeUser(user);

  // 12. Determine Suggested Portal
  let portalUrl = "/dashboard";
  if (user.role === "ADMIN") {
    portalUrl = "/admin";
  } else if (user.role === "OFFICER") {
    portalUrl = "/authority";
  }

  // 13. Create Response with HttpOnly Cookie
  const response = NextResponse.json(
    {
      success: true,
      message: "Successfully signed in.",
      token: sessionToken,
      user: safeUser,
      portalUrl,
    },
    { status: 200 }
  );

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
