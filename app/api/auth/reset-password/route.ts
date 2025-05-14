import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, code, and new password are required.",
        },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long.",
        },
        { status: 400 }
      );
    }

    // Find the user and verify the code and its expiry again
    // This is a crucial step to ensure the code presented is still valid
    // and belongs to the user attempting the password change.
    const user = await User.findOne({
      email,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset request. Please start over.",
        },
        { status: 400 }
      );
    }

    const hashedCode = crypto
      .createHash("sha256")
      .update(code) // The code from the query param, which was verified on the previous step
      .digest("hex");

    if (hashedCode !== user.passwordResetToken) {
      // This check ensures that the code used to reach the reset password form
      // is the same one that was originally verified.
      return NextResponse.json(
        { success: false, message: "Invalid reset code. Please start over." },
        { status: 400 }
      );
    }

    // Hash the new password (the pre-save hook in User.ts will also do this, but explicit here is fine)
    // const salt = await bcrypt.genSalt(10);
    // user.password = await bcrypt.hash(newPassword, salt);
    user.password = newPassword; // The pre-save hook in your User model will handle hashing

    // Clear the password reset fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Password has been reset successfully. You can now log in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    // Check for specific Mongoose validation errors if needed
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Server error during password reset." },
      { status: 500 }
    );
  }
}
