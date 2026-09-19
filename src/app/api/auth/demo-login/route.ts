import { NextRequest, NextResponse } from "next/server";
import { getQuickDemoUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const roleKey = body.roleKey as "citizen" | "officer" | "admin";

    const { user, token } = getQuickDemoUser(roleKey || "citizen");

    return NextResponse.json({
      success: true,
      user,
      token,
      message: `Scoped authentication token generated for role: ${user.role}. Role immutability enforced.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate demo session token" },
      { status: 500 }
    );
  }
}
