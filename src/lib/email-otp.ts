import crypto from "crypto";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds between resends

// Pepper for hashing OTPs (defaults to JWT_SECRET or secure fallback)
const OTP_PEPPER = process.env.OTP_PEPPER || process.env.JWT_SECRET || "civion_email_otp_pepper_secret_2026";

interface StoredOtpRecord {
  email: string;
  hashedOtp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

class EmailOtpManager {
  private records: Map<string, StoredOtpRecord> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Sweep expired OTP records every 2 minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupTimer = setInterval(() => this.cleanup(), 2 * 60 * 1000);
      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref();
      }
    }
  }

  /**
   * Hashes a 6-digit OTP code using SHA-256 and server-side secret pepper.
   */
  public hashOtp(email: string, otp: string): string {
    return crypto
      .createHmac("sha256", OTP_PEPPER)
      .update(`${email.toLowerCase()}:${otp}`)
      .digest("hex");
  }

  /**
   * Generates a cryptographically secure 6-digit numeric OTP.
   * Invalidates any previous active OTP for the email.
   */
  public generateOtp(email: string): { otp: string; expiresAt: number; cooldownSeconds: number } {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = this.records.get(normalizedEmail);
    const now = Date.now();

    // Check resend cooldown
    if (existing && now < existing.lastSentAt + RESEND_COOLDOWN_MS) {
      const remainingCooldown = Math.ceil((existing.lastSentAt + RESEND_COOLDOWN_MS - now) / 1000);
      throw new Error(`Please wait ${remainingCooldown}s before requesting a new code.`);
    }

    // Invalidate any previous OTP by generating new crypto random digits
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = this.hashOtp(normalizedEmail, rawOtp);
    const expiresAt = now + OTP_TTL_MS;

    this.records.set(normalizedEmail, {
      email: normalizedEmail,
      hashedOtp,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    });

    return {
      otp: rawOtp,
      expiresAt,
      cooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    };
  }

  /**
   * Verifies an OTP code for an email address.
   */
  public verifyOtp(
    email: string,
    otpCode: string
  ): {
    success: boolean;
    error?: string;
    code?: "INVALID_OTP" | "EXPIRED_OTP" | "MAX_ATTEMPTS_EXCEEDED" | "NOT_FOUND";
    remainingAttempts?: number;
  } {
    const normalizedEmail = email.toLowerCase().trim();
    const record = this.records.get(normalizedEmail);
    const now = Date.now();

    if (!record) {
      return {
        success: false,
        error: "Verification code has expired or was not found. Please request a new code.",
        code: "NOT_FOUND",
      };
    }

    // Check expiration
    if (now > record.expiresAt) {
      this.records.delete(normalizedEmail);
      return {
        success: false,
        error: "Verification code has expired. Please request a new code.",
        code: "EXPIRED_OTP",
      };
    }

    // Check maximum failed attempts
    if (record.attempts >= MAX_ATTEMPTS) {
      this.records.delete(normalizedEmail);
      return {
        success: false,
        error: "Maximum verification attempts exceeded. Please request a new code.",
        code: "MAX_ATTEMPTS_EXCEEDED",
      };
    }

    // Hash provided code and compare with timing-safe comparison
    const providedHash = this.hashOtp(normalizedEmail, otpCode.trim());
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(providedHash, "hex"),
      Buffer.from(record.hashedOtp, "hex")
    );

    if (!isMatch) {
      record.attempts += 1;
      const remaining = MAX_ATTEMPTS - record.attempts;

      if (remaining <= 0) {
        this.records.delete(normalizedEmail);
        return {
          success: false,
          error: "Maximum verification attempts exceeded. Please request a new code.",
          code: "MAX_ATTEMPTS_EXCEEDED",
        };
      }

      return {
        success: false,
        error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        code: "INVALID_OTP",
        remainingAttempts: remaining,
      };
    }

    // Success: Single-use consumption (delete record immediately)
    this.records.delete(normalizedEmail);

    return {
      success: true,
    };
  }

  /**
   * Sweeps expired OTP entries to conserve memory.
   */
  private cleanup() {
    const now = Date.now();
    this.records.forEach((record, email) => {
      if (now > record.expiresAt) {
        this.records.delete(email);
      }
    });
  }
}

// Global singleton for Next.js hot-reloads
const globalForOtp = global as unknown as { emailOtpManager?: EmailOtpManager };
export const emailOtpManager = globalForOtp.emailOtpManager || new EmailOtpManager();
if (process.env.NODE_ENV !== "production") globalForOtp.emailOtpManager = emailOtpManager;
