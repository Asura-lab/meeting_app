// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    // Check for user
    const user = await User.findOne({ email }).select("+password"); // Ensure isEmailVerified is selected by default or add it explicitly if not.
    // By default, fields are selected unless schema has `select: false` for the field itself.
    // Our User model has `isEmailVerified` selected by default.
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please verify your email before logging in. A code was sent to your email.",
          actionRequired: "verifyEmail", // Add this to help frontend
          email: user.email, // Send email back to redirect to OTP page
        },
        { status: 403 } // 403 Forbidden is appropriate here
      );
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error(
        "CRITICAL: JWT_SECRET is not defined for token signing in login."
      );
      throw new Error("Server configuration error: JWT_SECRET not set.");
    }
    const token = jwt.sign(
      { id: user._id },
      secret, // Use the secret from env
      {
        expiresIn: "1h",
      }
    );

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          _id: user._id,
          id: user._id.toString(), // Add this line
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          isEmailVerified: user.isEmailVerified,
        },
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": `token=${token}; Path=/; HttpOnly; Max-Age=${
            30 * 24 * 60 * 60
          }; SameSite=Lax`,
        },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
