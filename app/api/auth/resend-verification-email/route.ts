import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";
import { sendVerificationCodeEmail } from "@/lib/email"; // Import the new email utility

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

    const user = await User.findOne({ email }).select(
      "+emailVerificationToken +emailVerificationExpires +lastVerificationEmailSentAt +isEmailVerified"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User with this email not found." },
        { status: 404 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: false, message: "Email is already verified." },
        { status: 400 }
      );
    }

    // Rate limiting (e.g., 2 minutes)
    const twoMinutes = 2 * 60 * 1000;
    if (
      user.lastVerificationEmailSentAt &&
      new Date().getTime() -
        new Date(user.lastVerificationEmailSentAt).getTime() <
        twoMinutes
    ) {
      const timeLeft =
        twoMinutes -
        (new Date().getTime() -
          new Date(user.lastVerificationEmailSentAt).getTime());
      const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
      return NextResponse.json(
        {
          success: false,
          message: `Please wait approximately ${minutesLeft} minute(s) before requesting another verification code.`,
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Generate new 6-digit code and expiration
    const newVerificationCode = crypto.randomInt(100000, 999999).toString();
    const newVerificationExpires = new Date(Date.now() + 3600000); // 1 hour

    user.emailVerificationToken = newVerificationCode;
    user.emailVerificationExpires = newVerificationExpires;
    user.lastVerificationEmailSentAt = new Date(); // Update timestamp

    await user.save();
    await sendVerificationCodeEmail(user.email, newVerificationCode);

    return NextResponse.json(
      {
        success: true,
        message:
          "A new verification code has been sent. Please check your inbox.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Resend verification code error:", error);
    if (error.message === "Could not send verification code email.") {
      return NextResponse.json(
        {
          success: false,
          message: "Server error: Could not send verification code.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Server error during resend verification." },
      { status: 500 }
    );
  }
}
