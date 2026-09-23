import { NextRequest, NextResponse } from "next/server";
import { verifyRoleToken, sanitizeUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyRoleToken(token);

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = db.findUserById(payload.userId);
  if (!user) {
    return NextResponse.json({
      user: {
        id: payload.userId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        wardId: payload.wardId,
        emailVerified: payload.emailVerified,
        authorityStatus: payload.authorityStatus,
      },
    });
  }

  return NextResponse.json({
    user: sanitizeUser(user),
  });
}

