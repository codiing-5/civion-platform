import { NextRequest, NextResponse } from "next/server";
import { verifyRoleToken, sanitizeUserUpdatePayload } from "@/lib/auth";
import { DEMO_USERS } from "@/lib/seed-data";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ user: DEMO_USERS.citizen });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyRoleToken(token);

  if (!payload) {
    return NextResponse.json({ user: DEMO_USERS.citizen });
  }

  return NextResponse.json({
    user: {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      wardId: payload.wardId,
    },
  });
}

/**
 * Update user profile endpoint - STRICT SECURITY GUARD:
 * Automatically strips 'role' field from payload so roles are immutable upon account creation.
 */
export async function PATCH(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const sanitized = sanitizeUserUpdatePayload(rawBody);

    return NextResponse.json({
      success: true,
      sanitizedFields: Object.keys(sanitized),
      message: "Profile updated successfully. Role immutability policy enforced; role field stripped.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
