"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input"; // Import the Input component

const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email");
  const code = searchParams?.get("code"); // The verified code from the previous step

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false); // State for new password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility

  useEffect(() => {
    if (!email || !code) {
      toast.error("Invalid password reset link/session. Please start over.");
      router.push("/forgot-password");
    }
  }, [email, code, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      toast.error("Missing required information for password reset.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    toast.dismiss();

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          data.message || "Password reset successfully! Please log in."
        );
        router.push("/login");
      } else {
        toast.error(data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!email || !code) {
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
            src="/assets/reset-password.svg" // Choose a relevant image
            alt="Reset Password Illustration"
            width={300}
            height={300}
            className="mt-6 mx-auto md:mx-0"
          />
          <h2 className="text-4xl font-bold">Set Your New Password</h2>
          <p className="opacity-90">
            Choose a strong, new password for your account.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg space-y-6">
          <h3 className="text-3xl font-semibold text-gray-800 text-center">
            Create New Password
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full p-3 pr-10 border-gray-300 focus:ring-[#4da1e6] text-gray-700" // Added pr-10 for icon spacing
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 hover:text-gray-800"
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  <Image
                    src={
                      showNewPassword
                        ? "/assets/open-eye.svg"
                        : "/assets/close-eye.svg"
                    }
                    alt={showNewPassword ? "Open eye" : "Close eye"}
                    width={20}
                    height={20}
                  />
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full p-3 pr-10 border-gray-300 focus:ring-[#4da1e6] text-gray-700" // Added pr-10 for icon spacing
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 hover:text-gray-800"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  <Image
                    src={
                      showConfirmPassword
                        ? "/assets/open-eye.svg"
                        : "/assets/close-eye.svg"
                    }
                    alt={showConfirmPassword ? "Open eye" : "Close eye"}
                    width={20}
                    height={20}
                  />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                newPassword.length < 6 ||
                newPassword !== confirmPassword
              }
              className="w-full py-3 bg-gradient-to-r from-[#4da1e6] to-[#3a87c9] text-white rounded-lg shadow hover:from-[#3a87c9] hover:to-[#2e74b8] transition disabled:opacity-70"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-600">
            Remembered your password after all?{" "}
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

const ResetPasswordPage = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    }
  >
    <ResetPasswordContent />
  </Suspense>
);

export default ResetPasswordPage;
