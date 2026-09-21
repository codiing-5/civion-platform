import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signRoleToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, otp, fullName } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Step 1: Request OTP
    if (action === "REQUEST_OTP") {
      const existingUser = db.findUserByPhone(cleanPhone);
      const isExistingUser = !!existingUser;

      // Simulated OTP for development/demo environment
      const demoOtp = "123456";

      return NextResponse.json({
        success: true,
        isExistingUser,
        demoOtp,
        message: "Verification code sent to your mobile number.",
      });
    }

    // Step 2: Verify OTP
    if (action === "VERIFY_OTP") {
      if (!otp || otp.trim().length !== 6) {
        return NextResponse.json(
          { error: "Please enter the 6-digit verification code." },
          { status: 400 }
        );
      }

      // Allow 123456 or standard OTP
      if (otp !== "123456") {
        return NextResponse.json(
          { error: "The verification code entered is incorrect. (Use 123456 for demo)" },
          { status: 401 }
        );
      }

      let user = db.findUserByPhone(cleanPhone);

      if (!user) {
        // New citizen registration
        const name = fullName?.trim() || `Citizen ${cleanPhone.slice(-4)}`;
        user = db.createUser({
          phone: cleanPhone,
          name,
        });
      } else if (fullName?.trim() && user.name.startsWith("Citizen ")) {
        user.name = fullName.trim();
      }

      const token = signRoleToken(user);

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        token,
        message: "Successfully verified.",
      });
    }

    return NextResponse.json(
      { error: "Invalid authentication request." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Phone auth error:", error);
    return NextResponse.json(
      { error: "Authentication service unavailable. Please try again." },
      { status: 500 }
    );
  }
}
