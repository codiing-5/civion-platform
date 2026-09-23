"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  Shield,
} from "lucide-react";

export default function LoginPage() {
  const { user, login, sendVerificationOtp, isLoading, isPendingApproval, isAdmin, isAuthority } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  // If already logged in, redirect to appropriate role portal
  useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin) router.replace("/admin");
      else if (isAuthority) router.replace(isPendingApproval ? "/pending-approval" : "/authority");
      else router.replace("/dashboard");
    }
  }, [user, isLoading, router, isAdmin, isAuthority, isPendingApproval]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setUnverifiedEmail(null);
    setResendNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    const res = await login(cleanEmail, password);
    setIsSubmitting(false);

    if (!res.success) {
      if (res.code === "UNVERIFIED_EMAIL") {
        setUnverifiedEmail(cleanEmail);
        setErrorMessage(res.error || "Please verify your email address before signing in.");
      } else if (res.code === "PENDING_AUTHORITY_APPROVAL") {
        router.push("/pending-approval");
      } else if (res.code === "LEGACY_OTP_MIGRATION_REQUIRED") {
        router.push(`/forgot-password?email=${encodeURIComponent(cleanEmail)}&migration=true`);
      } else {
        setErrorMessage(res.error || "Email or password is incorrect.");
      }
      return;
    }

    // Success redirect
    router.replace(res.portalUrl || "/dashboard");
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail || isResending) return;

    setIsResending(true);
    setResendNotice(null);
    const res = await sendVerificationOtp(unverifiedEmail);
    setIsResending(false);

    if (res.success) {
      setResendNotice("Verification code sent! You can now verify your email.");
      setTimeout(() => {
        router.push(`/register?email=${encodeURIComponent(unverifiedEmail)}&step=verify`);
      }, 1200);
    } else {
      setErrorMessage(res.error || "Failed to resend verification code.");
    }
  };

  // Quick fill test credentials for testing
  const fillCredentials = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setErrorMessage(null);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-[#111827] p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            Sign in to access your Civion account
          </p>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">{errorMessage}</p>
              {unverifiedEmail && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="text-xs font-bold text-red-800 dark:text-red-200 underline hover:no-underline"
                >
                  {isResending ? "Sending verification email…" : "Click here to verify your email address"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Resend notice */}
        {resendNotice && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm flex items-start gap-3 animate-in fade-in"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium">{resendNotice}</p>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div>
            <label
              htmlFor="email-input"
              className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-2"
            >
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="email-input"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full min-h-[52px] pl-12 pr-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password-input"
                className="block text-sm font-bold text-slate-900 dark:text-slate-200"
              >
                Password
              </label>
              <Link
                href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full min-h-[52px] pl-12 pr-12 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !email.trim() || !password}
            className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span>{isSubmitting ? "Signing in…" : "Sign in"}</span>
            {!isSubmitting && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        {/* Register link */}
        <div className="text-center pt-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>

        {/* Quick Demo Test Logins */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block text-center mb-2.5">
            Quick Test Accounts (Password: Civion@2026!)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("rohan.nair@civion.org", "Civion@2026!")}
              className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors text-center"
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("suresh.kumar@kozhikodecorp.gov.in", "Civion@2026!")}
              className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors text-center"
            >
              Authority
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("rojan.jose@civion.org", "Civion@2026!")}
              className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors text-center"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Protected with municipal-grade encryption</span>
        </div>
      </div>
    </div>
  );
}
