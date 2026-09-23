"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";

function ForgotPasswordForm() {
  const { forgotPassword, resetPassword, user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Multi-step flow: "EMAIL" | "OTP_PASSWORD" | "SUCCESS"
  const [step, setStep] = useState<"EMAIL" | "OTP_PASSWORD" | "SUCCESS">("EMAIL");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [cooldown, setCooldown] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const isMigration = searchParams.get("migration") === "true";

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus OTP box on step transition
  useEffect(() => {
    if (step === "OTP_PASSWORD") {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Password Strength calculations
  const minLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  let strengthScore = 0;
  if (minLength) strengthScore++;
  if (hasUpper && hasLower) strengthScore++;
  if (hasNumber) strengthScore++;
  if (hasSpecial) strengthScore++;

  let strengthLabel = "Weak";
  let strengthColor = "bg-red-500 text-red-600";
  let strengthWidth = "w-1/4";

  if (strengthScore === 2) {
    strengthLabel = "Fair";
    strengthColor = "bg-amber-500 text-amber-600";
    strengthWidth = "w-2/4";
  } else if (strengthScore === 3) {
    strengthLabel = "Good";
    strengthColor = "bg-blue-500 text-blue-600";
    strengthWidth = "w-3/4";
  } else if (strengthScore >= 4) {
    strengthLabel = "Strong";
    strengthColor = "bg-emerald-500 text-emerald-600";
    strengthWidth = "w-full";
  }

  const isPasswordValid = minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Step 1: Send Reset OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    const res = await forgotPassword(cleanEmail);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Unable to send password reset code.");
      return;
    }

    setCooldown(res.cooldownSeconds || 60);
    if (res.devOtp) setDevOtpCode(res.devOtp);
    setStep("OTP_PASSWORD");
    setSuccessNotice("A 6-digit verification code has been sent to your email.");
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, "");
    if (cleanDigit.length > 1) {
      handleOtpPaste(cleanDigit);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanDigit;
    setOtp(newOtp);
    if (errorMessage) setErrorMessage(null);

    if (cleanDigit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (pastedText: string) => {
    const digits = pastedText.replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length === 0) return;

    const newOtp = ["", "", "", "", "", ""];
    digits.forEach((d, idx) => {
      if (idx < 6) newOtp[idx] = d;
    });
    setOtp(newOtp);
    if (errorMessage) setErrorMessage(null);

    const nextIndex = Math.min(digits.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the verification code.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage("Please choose a stronger password meeting all security requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(email.trim().toLowerCase(), otpCode, newPassword, confirmPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to reset password. The code may be invalid or expired.");
      return;
    }

    setStep("SUCCESS");
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsSubmitting(true);

    const res = await forgotPassword(email.trim().toLowerCase());
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Unable to resend reset code.");
      return;
    }

    setCooldown(res.cooldownSeconds || 60);
    if (res.devOtp) setDevOtpCode(res.devOtp);
    setSuccessNotice("A fresh 6-digit verification code has been sent.");
  };

  const fullOtpString = otp.join("");

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-[#111827] p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-4">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {step === "EMAIL" && (isMigration ? "Set up your password" : "Forgot your password?")}
            {step === "OTP_PASSWORD" && "Create new password"}
            {step === "SUCCESS" && "Password reset complete"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            {step === "EMAIL" &&
              (isMigration
                ? "Verify your registered email to set a permanent password for your Civion account."
                : "Enter your registered email address to receive a secure recovery code.")}
            {step === "OTP_PASSWORD" && `Enter the 6-digit code sent to ${email} and choose your new password.`}
            {step === "SUCCESS" && "Your password has been updated. You can now log in securely."}
          </p>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {successNotice && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm flex items-start gap-3 animate-in fade-in"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium">{successNotice}</p>
          </div>
        )}

        {/* Step 1: Email Form */}
        {step === "EMAIL" && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-2"
              >
                Registered email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="forgot-email"
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

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>{isSubmitting ? "Sending code…" : "Send verification code"}</span>
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        )}

        {/* Step 2: OTP & New Password Form */}
        {step === "OTP_PASSWORD" && (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            {/* 6-digit OTP code */}
            <div>
              <label
                htmlFor="otp-0"
                className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-2.5 text-center"
              >
                Enter 6-digit recovery code
              </label>

              <div
                className="flex items-center justify-between gap-2 sm:gap-2.5"
                onPaste={(e) => {
                  e.preventDefault();
                  handleOtpPaste(e.clipboardData.getData("text"));
                }}
              >
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Dev mode helper */}
              {devOtpCode && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between animate-in fade-in">
                  <div className="text-xs text-amber-900 dark:text-amber-200">
                    <span className="font-medium text-amber-700 dark:text-amber-400">Dev Code: </span>
                    <strong className="font-mono font-bold text-sm tracking-wider">
                      {devOtpCode}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp(devOtpCode.split("").slice(0, 6));
                      setErrorMessage(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-1.5"
                >
                  New password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full min-h-[48px] pl-10 pr-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">Password strength:</span>
                      <span className={strengthColor}>{strengthLabel}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${strengthColor} transition-all duration-300 ${strengthWidth}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  htmlFor="confirm-new-password"
                  className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-1.5"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirm-new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full min-h-[48px] pl-10 pr-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || fullOtpString.length !== 6 || !isPasswordValid || !passwordsMatch}
                className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>{isSubmitting ? "Updating password…" : "Update Password and Sign In"}</span>
                {!isSubmitting && <ArrowRight className="w-5 h-5" />}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isSubmitting}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("EMAIL");
                    setErrorMessage(null);
                  }}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Change email
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 3: Success Confirmation */}
        {step === "SUCCESS" && (
          <div className="text-center space-y-5 py-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto">
              ✓
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Your password has been successfully updated. You can now use your new password to access Civion.
            </p>
            <Link
              href="/login"
              className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <span>Return to Sign In</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Back to Login Link */}
        {step !== "SUCCESS" && (
          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              ← Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}

