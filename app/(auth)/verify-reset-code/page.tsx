"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

const VerifyResetCodeContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email");

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false); // New state for resend button

  useEffect(() => {
    if (!email) {
      toast.error(
        "Email not found. Please start the password reset process again."
      );
      router.push("/forgot-password");
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is missing.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    toast.dismiss();

    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          data.message || "Code verified! Redirecting to reset password..."
        );
        // Pass email and the verified code (or a new token if implemented) to the reset password page
        router.push(
          `/reset-password?email=${encodeURIComponent(
            email
          )}&code=${encodeURIComponent(code)}`
        );
      } else {
        toast.error(data.message || "Failed to verify code.");
      }
    } catch (error) {
      console.error("Verify code error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error("Email is missing. Cannot resend code.");
      return;
    }
    setIsResending(true);
    toast.dismiss();
    try {
      const res = await fetch("/api/auth/forgot-password", {
        // Use the existing forgot-password endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "A new verification code has been sent.");
      } else {
        toast.error(data.message || "Failed to resend code. Please try again.");
      }
    } catch (error) {
      console.error("Resend code error:", error);
      toast.error("An unexpected error occurred while resending the code.");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    // This will be handled by useEffect, but good for initial render
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading or invalid state...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#4da1e6] to-[#3a87c9] text-white p-10">
        <div className="space-y-4 max-w-sm text-center md:text-left">
          <Image
            src="/assets/verification.gif" // Or a more relevant image
            alt="Verification Illustration"
            width={300}
            height={300}
            className="mt-6 mx-auto md:mx-0"
          />
          <h2 className="text-4xl font-bold">Verify Your Identity</h2>
          <p className="opacity-90">
            Enter the 6-digit code sent to your email address to proceed with
            resetting your password.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg space-y-6">
          <h3 className="text-3xl font-semibold text-gray-800 text-center">
            Enter Verification Code
          </h3>
          <p className="text-center text-sm text-gray-600">
            A 6-digit code was sent to <strong>{email}</strong>. Please enter it
            below.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d{0,6}$/.test(val)) {
                    // Allow only up to 6 digits
                    setCode(val);
                  }
                }}
                placeholder=""
                maxLength={6}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700 text-center tracking-[0.5em]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-[#4da1e6] to-[#3a87c9] text-white rounded-lg shadow hover:from-[#3a87c9] hover:to-[#2e74b8] transition disabled:opacity-70"
            >
              {isSubmitting ? "Verifying..." : "Verify Code"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-[#4da1e6] font-medium hover:underline disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isResending ? "Sending..." : "Resend Code"}
            </button>{" "}
            or{" "}
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
};

// Wrap with Suspense for useSearchParams
const VerifyResetCodePage = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    }
  >
    <VerifyResetCodeContent />
  </Suspense>
);

export default VerifyResetCodePage;
