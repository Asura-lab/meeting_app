"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    toast.dismiss();

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          data.message || "Password reset code sent if email is registered."
        );
        router.push(`/verify-reset-code?email=${encodeURIComponent(email)}`);
      } else {
        toast.error(data.message || "Failed to send password reset link.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Illustration / Welcome Panel */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#4da1e6] to-[#3a87c9] text-white p-10">
        <div className="space-y-4 max-w-sm text-center md:text-left">
          <Image
            src="/assets/reset-password.svg"
            alt="Forgot Password Illustration"
            width={300}
            height={300}
            className="mt-6 mx-auto md:mx-0"
          />
          <h2 className="text-4xl font-bold">Forgot Your Password?</h2>
          <p className="opacity-90">
            No worries! Enter your email address and we'll send you a link to
            reset your password.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg space-y-6">
          <h3 className="text-3xl font-semibold text-gray-800 text-center">
            Reset Password
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-[#4da1e6] to-[#3a87c9] text-white rounded-lg shadow hover:from-[#3a87c9] hover:to-[#2e74b8] transition disabled:opacity-70"
            >
              {isSubmitting ? "Sending..." : "Send verification code"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-[#4da1e6] font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
