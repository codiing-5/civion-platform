/**
 * Validates and normalizes email addresses and OTP verification codes.
 */

// Standard RFC 5322 compliant email regex
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// 6-digit numeric OTP regex
export const OTP_CODE_REGEX = /^\d{6}$/;

export interface EmailValidationResult {
  isValid: boolean;
  email?: string;
  error?: string;
}

/**
 * Validates and normalizes an email address.
 * Converts to lowercase and trims whitespace.
 */
export function sanitizeAndValidateEmail(input: unknown): EmailValidationResult {
  if (typeof input !== "string" || !input.trim()) {
    return {
      isValid: false,
      error: "Email address is required.",
    };
  }

  const normalized = input.trim().toLowerCase();

  if (normalized.length > 254) {
    return {
      isValid: false,
      error: "Email address is too long (maximum 254 characters).",
    };
  }

  if (!EMAIL_REGEX.test(normalized)) {
    return {
      isValid: false,
      error: "Please enter a valid email address (e.g. citizen@example.com).",
    };
  }

  return {
    isValid: true,
    email: normalized,
  };
}

/**
 * Validates that an OTP code is strictly a 6-digit numeric string.
 */
export function validateOtpCode(code: unknown): { isValid: boolean; cleanCode?: string; error?: string } {
  if (typeof code !== "string" && typeof code !== "number") {
    return {
      isValid: false,
      error: "Verification code must be a 6-digit string.",
    };
  }

  const strCode = String(code).trim();

  if (!OTP_CODE_REGEX.test(strCode)) {
    return {
      isValid: false,
      error: "Verification code must consist of exactly 6 numeric digits.",
    };
  }

  return {
    isValid: true,
    cleanCode: strCode,
  };
}
