import { NextRequest, NextResponse } from "next/server";
import { verifyRoleToken, sanitizeUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthorityStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyRoleToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Access denied. Administrator privileges required." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ALL";

  const authorities = db.getAuthorities(status).map((u) => sanitizeUser(u));

  return NextResponse.json({
    success: true,
    count: authorities.length,
    authorities,
  });
}

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyRoleToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Access denied. Administrator privileges required." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { userId, status, wardId } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { success: false, error: "userId and status are required." },
        { status: 400 }
      );
    }

    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status must be PENDING, APPROVED, or REJECTED." },
        { status: 400 }
      );
    }

    const updated = db.updateAuthorityStatus(userId, status as AuthorityStatus);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Authority user not found." }, { status: 404 });
    }

    if (wardId !== undefined) {
      db.updateUser(userId, { wardId: Number(wardId) });
    }

    return NextResponse.json({
      success: true,
      message: `Authority account for ${updated.name} has been set to ${status}.`,
      user: sanitizeUser(updated),
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update authority status." }, { status: 500 });
  }
}
