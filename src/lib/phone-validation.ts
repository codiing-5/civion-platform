/**
 * Validates and sanitizes phone numbers and OTP verification codes.
 * Ensures strict compliance with ITU-T E.164 formatting standards.
 */

// Strict E.164 pattern: Starts with '+', followed by non-zero country code, and 1 to 14 digits (total max 15 digits)
export const E164_REGEX = /^\+[1-9]\d{1,14}$/;

// 6-digit numeric OTP regex
export const OTP_CODE_REGEX = /^\d{6}$/;

export interface PhoneValidationResult {
  isValid: boolean;
  e164?: string;
  error?: string;
}

/**
 * Sanitizes and validates a phone number string into strict E.164 format.
 * 
 * @param input - The raw phone number string (e.g. "+1 (555) 123-4567", "9895011223", "+91 98950 11223")
 * @param defaultCountryCode - Optional fallback country code (e.g., "+1" or "+91") if none provided
 */
export function sanitizeAndValidateE164(
  input: unknown,
  defaultCountryCode?: string
): PhoneValidationResult {
  if (typeof input !== "string" || !input.trim()) {
    return {
      isValid: false,
      error: "Phone number is required.",
    };
  }

  let cleaned = input.trim();

  // Strip common visual formatting characters (spaces, dashes, dots, parens)
  cleaned = cleaned.replace(/[\s\-\(\)\.]/g, "");

  // Handle international double zero prefix "00" (replace with "+")
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  // If number lacks leading '+', attempt fallback prefix if provided
  if (!cleaned.startsWith("+")) {
    if (defaultCountryCode) {
      const formattedPrefix = defaultCountryCode.startsWith("+")
        ? defaultCountryCode
        : `+${defaultCountryCode}`;
      cleaned = `${formattedPrefix}${cleaned.replace(/^0+/, "")}`;
    } else {
      // If no default country code is supplied and no '+' exists, return format error
      return {
        isValid: false,
        error: "Phone number must include an international country code (e.g., +1234567890).",
      };
    }
  }

  // Validate against strict E.164 format
  if (!E164_REGEX.test(cleaned)) {
    return {
      isValid: false,
      error: "Invalid phone number format. Must follow standard E.164 format (e.g., +1234567890, max 15 digits).",
    };
  }

  // Minimum length check (E.164 country code + subscriber number is at least 7 digits)
  if (cleaned.length < 8) {
    return {
      isValid: false,
      error: "Phone number is too short.",
    };
  }

  return {
    isValid: true,
    e164: cleaned,
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
