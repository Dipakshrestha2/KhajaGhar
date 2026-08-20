"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "../../../node_modules/next-auth/react";
import { ChefHat, Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Login successful!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 to-surface-100 px-4 py-12">
      {/* Decorative bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary-600/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/20">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-[family-name:var(--font-outfit)] text-gradient">
              KhajaGhar
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-surface-900">Welcome back</h1>
          <p className="text-surface-500 text-sm mt-1">
            Sign in to your account to continue
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-white border border-surface-200/60 shadow-xl shadow-surface-200/30 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="you@example.com"
                className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-surface-700">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/20"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 border-t border-surface-200 pt-4">
            <p className="text-xs text-center text-surface-500 mb-3">
              Demo Accounts (password: Demo@123)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Customer", email: "customer@example.com" },
                { label: "Restaurant", email: "restaurant@example.com" },
                { label: "Admin", email: "admin@example.com" },
              ].map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() =>
                    setFormData({ email: demo.email, password: "Demo@123" })
                  }
                  className="rounded-lg bg-surface-100 px-2 py-2 text-[11px] font-medium text-surface-600 hover:bg-surface-200 transition-colors"
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Register Link */}
        <p className="text-center text-sm text-surface-500 mt-5">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
