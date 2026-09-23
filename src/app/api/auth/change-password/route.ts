import { NextRequest, NextResponse } from "next/server";
import { verifyRoleToken, verifyPassword, hashPassword, validatePasswordStrength } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ChangePasswordRequestBody {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyRoleToken(token);
  if (!payload) {
    return NextResponse.json({ success: false, error: "Session expired. Please log in again." }, { status: 401 });
  }

  const user = db.findUserById(payload.userId);
  if (!user) {
    return NextResponse.json({ success: false, error: "User account not found." }, { status: 404 });
  }

  // 2. Parse body
  let body: ChangePasswordRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON request payload." }, { status: 400 });
  }

  const currentPassword = body.currentPassword || "";
  const newPassword = body.newPassword || "";
  const confirmPassword = body.confirmPassword || "";

  // 3. Check current password if user already has one
  if (user.passwordHash) {
    const isCurrentValid = verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect.", code: "INVALID_CURRENT_PASSWORD" },
        { status: 400 }
      );
    }
  }

  // 4. Validate new password
  if (!newPassword) {
    return NextResponse.json(
      { success: false, error: "Please enter a new password.", code: "MISSING_PASSWORD" },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { success: false, error: "New passwords do not match.", code: "PASSWORD_MISMATCH" },
      { status: 400 }
    );
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: `Please choose a stronger password: ${strength.feedback.join(", ")}.`,
        code: "WEAK_PASSWORD",
        feedback: strength.feedback,
      },
      { status: 400 }
    );
  }

  // 5. Update user password
  const newHash = hashPassword(newPassword);
  db.updateUser(user.id, { passwordHash: newHash, emailVerified: true });

  return NextResponse.json(
    { success: true, message: "Your password has been successfully updated." },
    { status: 200 }
  );
}
