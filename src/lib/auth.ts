import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Role, User, AuthorityStatus } from "./types";
import { DEMO_USERS } from "./seed-data";

const JWT_SECRET = process.env.JWT_SECRET || "civion_citizen_platform_secret_2026_jwt";

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  wardId?: number;
  emailVerified?: boolean;
  authorityStatus?: AuthorityStatus;
}

/**
 * Validates password strength against security policy:
 * - At least 8 characters
 * - Uppercase letter
 * - Lowercase letter
 * - Numeric digit
 * - Special character
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0 to 4 (Weak, Fair, Good, Strong)
  strengthLabel: "Weak" | "Fair" | "Good" | "Strong";
  feedback: string[];
  meets: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
} {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const feedback: string[] = [];
  if (!minLength) feedback.push("At least 8 characters");
  if (!hasUpper) feedback.push("At least one uppercase letter (A-Z)");
  if (!hasLower) feedback.push("At least one lowercase letter (a-z)");
  if (!hasNumber) feedback.push("At least one number (0-9)");
  if (!hasSpecial) feedback.push("At least one special character (!@#$%^&*...)");

  let score = 0;
  if (minLength) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  let strengthLabel: "Weak" | "Fair" | "Good" | "Strong" = "Weak";
  if (score === 2) strengthLabel = "Fair";
  else if (score === 3) strengthLabel = "Good";
  else if (score >= 4) strengthLabel = "Strong";

  const isValid = minLength && hasUpper && hasLower && hasNumber && hasSpecial;

  return {
    isValid,
    score,
    strengthLabel,
    feedback,
    meets: {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    },
  };
}

/**
 * Hashes a plaintext password using PBKDF2 with a unique cryptographically random salt.
 * Output format: salt:hash (hex encoded)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const keylen = 64;
  const digest = "sha512";

  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored salt:hash string.
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash || !storedHash.includes(":")) {
    return false;
  }

  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) {
    return false;
  }

  const iterations = 100000;
  const keylen = 64;
  const digest = "sha512";

  const computedHash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(originalHash, "hex"));
  } catch {
    return false;
  }
}

/**
 * Signs a JWT session token for an authenticated user
 */
export function signRoleToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    name: user.name,
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "CITIZEN",
    wardId: user.wardId,
    emailVerified: user.emailVerified ?? false,
    authorityStatus: user.authorityStatus,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "30d",
    issuer: "civion-platform",
  });
}

/**
 * Verifies JWT token and extracts session payload
 */
export function verifyRoleToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "civion-platform",
    }) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Helper to safely sanitize user object for client response (stripping sensitive hashes)
 */
export function sanitizeUser(user: User): Omit<User, "passwordHash"> {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Helper to get quick demo user tokens
 */
export function getQuickDemoUser(roleKey: "citizen" | "officer" | "admin"): {
  user: Omit<User, "passwordHash">;
  token: string;
} {
  const user = DEMO_USERS[roleKey] || DEMO_USERS.citizen;
  const token = signRoleToken(user);
  return { user: sanitizeUser(user), token };
}

/**
 * Strips sensitive keys on user profile updates
 */
export function sanitizeUserUpdatePayload<T extends Record<string, any>>(payload: T): Partial<T> {
  const sanitized = { ...payload };
  delete (sanitized as any).role;
  delete (sanitized as any).id;
  delete (sanitized as any).passwordHash;
  delete (sanitized as any).emailVerified;
  delete (sanitized as any).authorityStatus;
  delete (sanitized as any).createdAt;
  delete (sanitized as any).updatedAt;
  return sanitized;
}

