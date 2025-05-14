import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";
import { sendPasswordResetCodeEmail } from "@/lib/email"; // Renamed for clarity

// Function to generate a 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.log(
        `Password reset code requested for non-existent email: ${email}`
      );
      return NextResponse.json(
        {
          success: true,
          message:
            "If an account with this email exists, a verification code has been sent.",
        },
        { status: 200 }
      );
    }

    if (!user.isEmailVerified) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please verify your email address before resetting the password.",
        },
        { status: 403 }
      );
    }

    // Generate a 6-digit verification code
    const resetCode = generateVerificationCode();
    const hashedResetCode = crypto
      .createHash("sha256")
      .update(resetCode)
      .digest("hex");

    const passwordResetExpires = new Date(Date.now() + 600000); // Code expires in 10 minutes

    user.passwordResetToken = hashedResetCode; // Store the hashed code
    user.passwordResetExpires = passwordResetExpires;
    await user.save();

    try {
      await sendPasswordResetCodeEmail(
        user.email,
        user.firstName || "User",
        resetCode,
        user.username // Add the username argument
      );
      return NextResponse.json(
        {
          success: true,
          message:
            "A 6-digit verification code has been sent to your email. Please check your inbox.",
        },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Failed to send password reset code email:", emailError);
      // user.passwordResetToken = undefined; // Optional: Clear token if email fails
      // user.passwordResetExpires = undefined;
      // await user.save();
      return NextResponse.json(
        {
          success: true, // Still return true for security
          message:
            "If an account with this email exists, a verification code has been sent. If you don't receive it, please try again or contact support.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error during password reset process.",
      },
      { status: 500 }
    );
  }
}
