import jwt from "jsonwebtoken";
import { Role, User } from "./types";
import { DEMO_USERS } from "./seed-data";

const JWT_SECRET = process.env.JWT_SECRET || "civion_dev_fallback_secret_key_2026";

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: Role;
  wardId?: number;
}

/**
 * Signs a role-scoped JWT token for authenticated session or QuickDemo switcher.
 */
export function signRoleToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    wardId: user.wardId,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
    issuer: "civion-platform",
  });
}

/**
 * Verifies JWT token and extracts role payload.
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
 * QuickDemo token generator: issues a valid scoped JWT for CITIZEN, OFFICER, or ADMIN
 * for judging evaluations without mutating database tables.
 */
export function getQuickDemoUser(roleKey: "citizen" | "officer" | "admin"): {
  user: User;
  token: string;
} {
  const user = DEMO_USERS[roleKey] || DEMO_USERS.citizen;
  const token = signRoleToken(user);
  return { user, token };
}

/**
 * SECURITY GUARD: Role Immutability.
 * Strips 'role', 'id', 'createdAt' from any incoming user profile update payload.
 * Prevents privilege escalation attacks via profile update route handlers.
 */
export function sanitizeUserUpdatePayload<T extends Record<string, any>>(payload: T): Partial<T> {
  const sanitized = { ...payload };
  delete (sanitized as any).role;
  delete (sanitized as any).id;
  delete (sanitized as any).createdAt;
  delete (sanitized as any).updatedAt;
  return sanitized;
}
