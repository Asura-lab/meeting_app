// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken"; // Import jwt

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No verification token provided." },
        { status: 400 }
      );
    }

    // Find user by verification token and check expiration
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }, // Ensure token hasn't expired
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    // Mark user as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null; // Clear token
    user.emailVerificationExpires = null; // Clear expiration
    await user.save();

    // Redirect to a success page or return a response
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    return NextResponse.redirect(`${baseUrl}/login?verified=true`); // Or JSON response
    // return NextResponse.json(
    //   { success: true, message: 'Email verified successfully.' },
    //   { status: 200 }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during verification." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and verification code are required.",
        },
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

    // Find user by email and select verification fields
    const user = await User.findOne({ email }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    if (user.isEmailVerified) {
      // If already verified, consider if they should be logged in or just informed.
      // For now, let's keep the existing behavior for this specific case.
      // A token could be generated here too if desired.
      return NextResponse.json(
        { success: true, message: "Email is already verified." },
        { status: 200 }
      );
    }

    if (!user.emailVerificationToken || user.emailVerificationToken !== code) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code." },
        { status: 400 }
      );
    }

    if (
      !user.emailVerificationExpires ||
      new Date() > new Date(user.emailVerificationExpires)
    ) {
      return NextResponse.json(
        { success: false, message: "Verification code has expired." },
        { status: 400 }
      );
    }

    // Mark user as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null; // Clear token
    user.emailVerificationExpires = null; // Clear expiration
    await user.save();

    // Create token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error(
        "CRITICAL: JWT_SECRET is not defined for token signing in email verification."
      );
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error, cannot complete login.",
        },
        { status: 500 }
      );
    }
    const token = jwt.sign({ id: user._id }, secret, {
      expiresIn: "1h", // Or your preferred expiration
    });

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully. You are now logged in.",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl, // Ensure this aligns with your User model and AuthContext
          isEmailVerified: user.isEmailVerified,
        },
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": `token=${token}; Path=/; HttpOnly; Max-Age=${
            30 * 24 * 60 * 60 // Example: 30 days
          }; SameSite=Lax`,
        },
      }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during email verification." },
      { status: 500 }
    );
  }
}

// Remove or comment out the old GET handler if it's no longer needed
// export async function GET(req: NextRequest) { ... }
