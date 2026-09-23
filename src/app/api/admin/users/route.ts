import { NextRequest, NextResponse } from "next/server";
import { verifyRoleToken, sanitizeUser } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const rawUsers = db.getAllUsers();
  const users = rawUsers.map((u) => sanitizeUser(u));

  const roleCounts = {
    CITIZEN: users.filter((u) => u.role === "CITIZEN").length,
    OFFICER: users.filter((u) => u.role === "OFFICER").length,
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
  };

  const pendingApprovals = users.filter((u) => u.role === "OFFICER" && u.authorityStatus === "PENDING").length;

  return NextResponse.json({
    success: true,
    totalUsers: users.length,
    roleCounts,
    pendingApprovals,
    users,
  });
}
