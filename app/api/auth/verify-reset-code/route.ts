import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: "Email and code are required." },
        { status: 400 }
      );
    }

    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid code format. Must be a 6-digit number.",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      email,
      passwordResetExpires: { $gt: new Date() }, // Check if token is not expired
    }).select("+passwordResetToken +passwordResetExpires"); // Ensure these fields are selected

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired code. Please try again.",
        },
        { status: 400 }
      );
    }

    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    if (hashedCode !== user.passwordResetToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid code. Please check and try again.",
        },
        { status: 400 }
      );
    }

    // At this point, the code is valid.
    // For added security, you might want to issue a new, short-lived token for the actual password reset step.
    // For simplicity in this step, we'll assume successful verification allows proceeding to reset password.
    // The passwordResetToken will be cleared after the password is actually reset.

    return NextResponse.json(
      {
        success: true,
        message: "Code verified successfully. You can now reset your password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify reset code error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during code verification." },
      { status: 500 }
    );
  }
}
