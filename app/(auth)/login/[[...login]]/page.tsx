"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Link from "next/link";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // Added for "Remember Me" checkbox
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(email, password); // login function in useAuth
      toast.success("Login successful");
      router.push("/"); // Or to the intended page after login
    } catch (error: any) {
      // Check if the error indicates email verification is needed
      if (error.actionRequired === "verifyEmail" && error.email) {
        toast.error(error.message || "Please verify your email.");
        // Redirect to the OTP verification page, passing the email
        router.push(
          `/verify-email-otp?email=${encodeURIComponent(error.email)}`
        );
      } else {
        toast.error(
          error.message || "Login failed. Please check your credentials."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Illustration / Welcome Panel */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#4da1e6] to-[#3a87c9] text-white p-10">
        <div className="space-y-4 max-w-sm">
          <Image
            src="/assets/meeting-picture-background.svg"
            alt="Web illustration"
            width={300}
            height={300}
            className="mt-6"
          />
          <h2 className="text-4xl font-bold">Explore the Open Web</h2>
          <p className="opacity-90">
            The web is your canvas for connection, creativity, and discovery.
            Log in to dive into dynamic content and global communities beyond
            imagination.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex items-center justify-center p-8 bg-gray-50">
        {/* add flip classes here */}
        <div
          className="
            w-full max-w-md bg-white p-8 rounded-xl shadow-lg space-y-6
            transform-preserve-3d backface-hidden animate-flipInY
          "
        >
          <h3 className="text-3xl font-semibold text-gray-800 text-center">
            Sign In
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                required
              />
            </div>

            {/* Password Input with Show/Hide */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4da1e6] text-gray-700"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 p-2"
              >
                {showPassword ? (
                  <Image
                    src="/assets/close-eye.svg"
                    alt="Hide"
                    width={20}
                    height={20}
                  />
                ) : (
                  <Image
                    src="/assets/open-eye.svg"
                    alt="Show"
                    width={20}
                    height={20}
                  />
                )}
              </button>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#4da1e6] focus:ring-[#4da1e6] border-gray-300 rounded"
                />
                <span className="text-gray-600">Remember Me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-[#4da1e6] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-[#4da1e6] to-[#3a87c9] text-white rounded-lg shadow hover:from-[#3a87c9] hover:to-[#2e74b8] transition"
            >
              {isSubmitting ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              href="/register"
              className="text-[#4da1e6] font-medium hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
