import jwt from "jsonwebtoken";
import { Role, User } from "./types";
import { DEMO_USERS } from "./seed-data";

const JWT_SECRET = process.env.JWT_SECRET || "civion_citizen_platform_secret_2026_jwt";

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  wardId?: number;
}

/**
 * Signs a JWT session token for authenticated citizen or officer
 */
export function signRoleToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    name: user.name,
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "CITIZEN",
    wardId: user.wardId,
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
 * Helper to get quick demo user tokens
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
 * Strips sensitive keys on user profile updates
 */
export function sanitizeUserUpdatePayload<T extends Record<string, any>>(payload: T): Partial<T> {
  const sanitized = { ...payload };
  delete (sanitized as any).role;
  delete (sanitized as any).id;
  delete (sanitized as any).createdAt;
  delete (sanitized as any).updatedAt;
  return sanitized;
}
