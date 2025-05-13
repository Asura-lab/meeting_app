// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationCodeEmail } from "@/lib/email"; // Import the new email utility

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { username, email, password, firstName, lastName } = await req.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email }).select(
      "+isEmailVerified"
    );
    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        // Optionally, resend code or prompt to verify
        return NextResponse.json(
          {
            success: false,
            message:
              "User already exists, email not verified. Please check your email for a verification code or request a new one.",
            actionRequired: "verifyEmail",
            email: existingUser.email,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return NextResponse.json(
        { success: false, message: "Username already exists" },
        { status: 400 }
      );
    }

    // Generate 6-digit email verification code
    const emailVerificationCode = crypto.randomInt(100000, 999999).toString();
    const emailVerificationExpiresValue = new Date(Date.now() + 3600000); // 1 hour

    console.log(
      `DEBUG: Generated emailVerificationCode: ${emailVerificationCode}`
    );

    const userPayload = {
      username,
      email,
      password,
      firstName,
      lastName,
      emailVerificationToken: emailVerificationCode, // Store the code
      emailVerificationExpires: emailVerificationExpiresValue,
      isEmailVerified: false,
    };

    const user = await User.create(userPayload);

    console.log(
      "Saved user (raw object from create):",
      JSON.parse(JSON.stringify(user))
    );

    // Send verification email with the code
    await sendVerificationCodeEmail(user.email, emailVerificationCode);

    return NextResponse.json(
      {
        success: true,
        message:
          "Registration successful. Please check your email for a 6-digit verification code.",
        user: {
          // Send minimal user info, or just email
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    if (error.message === "Could not send verification code email.") {
      // Potentially delete the user or mark them as needing verification email resent
      return NextResponse.json(
        {
          success: false,
          message:
            "Registration succeeded but failed to send verification email. Please try resending the code.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Server error during registration.",
      },
      { status: 500 }
    );
  }
}
