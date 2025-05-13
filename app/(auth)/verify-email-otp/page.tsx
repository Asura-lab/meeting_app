"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image"; // Added for illustration panel
import { useAuth } from "@/context/AuthContext"; // Import useAuth

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams?.get("email");
  const auth = useAuth(); // Get auth context

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    } else {
      // Optional: redirect if email is not in query, or show an error
      // toast.error("Email not provided for verification.");
      // router.push("/login");
    }
  }, [emailFromQuery, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || otp.length !== 6) {
      toast.error(
        "Please enter a valid 6-digit OTP and ensure email is present."
      );
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.token && data.user) {
        toast.success(
          data.message || "Email verified successfully! You are now logged in."
        );
        // Use AuthContext to set user data and token, which also handles localStorage
        auth.setAuthData(data.token, data.user);
        // The server has already set the HttpOnly cookie.
        // Redirect to the home page. AuthProvider on the home page will handle auth state.
        router.push("/");
      } else if (res.ok && data.success) {
        // Verification was successful, but token/user data wasn't returned (e.g., server config issue for token)
        toast.success(
          data.message ||
            "Email verified successfully! Please log in to continue."
        );
        router.push("/login"); // Fallback to login page
      } else {
        toast.error(data.message || "Verification failed.");
      }
    } catch (error) {
      toast.error("An error occurred during verification.");
      console.error("Verification error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error("Email address is missing to resend code.");
      return;
    }
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification-email", {
        // Or your potentially renamed route
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "A new verification code has been sent.");
      } else {
        toast.error(data.message || "Failed to resend code.");
      }
    } catch (error) {
      toast.error("An error occurred while resending the code.");
      console.error("Resend code error:", error);
    } finally {
      setIsResending(false);
    }
  };

  if (!emailFromQuery) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Illustration Panel - Consistent with login/register */}
        <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#4da1e6] to-[#3a87c9] text-white p-10">
          <div className="space-y-4 max-w-sm">
            <Image
              src="/assets/meeting-picture-background.svg" // Assuming you want the same image
              alt="Web illustration"
              width={300}
              height={300}
              className="mt-6"
            />
            <h2 className="text-4xl font-bold">Explore the Open Web</h2>
            <p className="opacity-90">
              Secure your account to continue exploring dynamic content and
              global communities.
            </p>
          </div>
        </div>
        {/* Form Panel */}
        <div className="flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg transform-preserve-3d backface-hidden animate-flipInY">
            <h2 className="text-3xl font-semibold text-gray-800 text-center">
              Email Required
            </h2>
            <p className="text-center text-gray-600">
              No email address was provided for verification. Please try
              registering or logging in again.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 bg-gradient-to-r from-[#4da1e6] to-[#3a87c9] text-white rounded-lg shadow hover:from-[#3a87c9] hover:to-[#2e74b8] transition text-center"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Illustration / Welcome Panel */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#4da1e6] to-[#3a87c9] text-white p-10">
        <div className="space-y-4 max-w-sm">
          <Image
            src="/assets/meeting-picture-background.svg" // Assuming you want the same image
            alt="Web illustration"
            width={300}
            height={300}
            className="mt-6"
          />
          <h2 className="text-4xl font-bold">Verify Your Account</h2>
          <p className="opacity-90">
            Just one more step to secure your access. Enter the code sent to
            your email.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg space-y-6 transform-preserve-3d backface-hidden animate-flipInY">
          <h2 className="text-3xl font-semibold text-gray-800 text-center">
            Verify Your Email
          </h2>
          <p className="text-center text-gray-600">
            A 6-digit verification code has been sent to{" "}
            <strong className="text-gray-700">{email}</strong>. Please enter it
            below.
          </p>
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label htmlFor="otp" className="sr-only">
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700 text-center text-lg"
                placeholder=""
                required
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying || otp.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-[#4da1e6] to-[#3a87c9] text-white rounded-lg shadow hover:from-[#3a87c9] hover:to-[#2e74b8] transition disabled:opacity-70"
            >
              {isVerifying ? "Verifying..." : "Verify Email"}
            </button>
          </form>
          <div className="text-center">
            <button
              onClick={handleResendCode}
              disabled={isResending}
              className="text-sm text-[#4da1e6] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? "Sending..." : "Didn't receive the code? Resend."}
            </button>
          </div>
          <p className="text-sm text-center text-gray-600">
            Changed your mind?{" "}
            <Link
              href="/login"
              className="text-[#4da1e6] font-medium hover:underline"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
