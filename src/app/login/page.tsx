"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lock,
  User as UserIcon,
} from "lucide-react";

export default function LoginPage() {
  const { user, requestOtp, verifyOtp, isLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"PHONE" | "OTP" | "NAME">("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);
    const res = await requestOtp(cleanPhone);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Unable to send verification code. Please try again.");
      return;
    }

    setIsExistingUser(res.isExistingUser);
    setDemoOtpCode(res.demoOtp || "123456");
    setStep("OTP");
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otp.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }

    if (!isExistingUser && step === "OTP") {
      // Prompt for name for new users
      setStep("NAME");
      return;
    }

    await executeVerification();
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    await executeVerification(fullName.trim());
  };

  const executeVerification = async (nameToSave?: string) => {
    setIsSubmitting(true);
    const res = await verifyOtp(phone, otp, nameToSave || fullName);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "The code entered is invalid. Please try again.");
      return;
    }

    router.replace("/dashboard");
  };

  const fillDemoOtp = () => {
    if (demoOtpCode) {
      setOtp(demoOtpCode);
      setErrorMessage(null);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-[#111827] p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {step === "PHONE" && "Enter your mobile number"}
            {step === "OTP" && "Enter verification code"}
            {step === "NAME" && "What is your name?"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {step === "PHONE" && "We'll send you a fast 6-digit code to log in."}
            {step === "OTP" && `Code sent to +91 ${phone}`}
            {step === "NAME" && "Help municipal officers address you correctly."}
          </p>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Step 1: Phone Input */}
        {step === "PHONE" && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="phone-input"
                className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-2"
              >
                Mobile Number
              </label>
              <div className="relative flex rounded-2xl shadow-sm">
                <span className="inline-flex items-center px-4 rounded-l-2xl border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-base sm:text-lg">
                  +91
                </span>
                <input
                  id="phone-input"
                  type="tel"
                  maxLength={10}
                  autoComplete="tel-national"
                  autoFocus
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(cleaned);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="flex-1 min-h-[52px] px-4 rounded-r-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-lg font-medium tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || phone.length !== 10}
              className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>{isSubmitting ? "Sending code…" : "Get Verification Code"}</span>
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {step === "OTP" && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="otp-input"
                className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-2"
              >
                6-Digit Verification Code
              </label>
              <input
                id="otp-input"
                type="text"
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={otp}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(cleaned);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full min-h-[52px] text-center text-2xl font-bold tracking-[0.4em] px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Demo auto-fill convenience */}
              {demoOtpCode && (
                <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                  <div className="text-xs text-blue-800 dark:text-blue-300">
                    <span>Demo Code: </span>
                    <strong className="font-mono font-bold text-sm">
                      {demoOtpCode}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={fillDemoOtp}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>
                  {isSubmitting
                    ? "Checking code…"
                    : isExistingUser
                    ? "Verify & Open Dashboard"
                    : "Continue"}
                </span>
                {!isSubmitting && <ArrowRight className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("PHONE");
                  setOtp("");
                  setErrorMessage(null);
                }}
                className="w-full py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Change mobile number
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Full Name (New Users) */}
        {step === "NAME" && (
          <form onSubmit={handleNameSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name-input"
                className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  id="name-input"
                  type="text"
                  autoFocus
                  placeholder="Example: Rajesh Menon"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full min-h-[52px] pl-12 pr-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !fullName.trim()}
              className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>{isSubmitting ? "Creating your account…" : "Complete Sign Up"}</span>
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        )}

        {/* Privacy Note */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Your number is private and never shared publicly.</span>
        </div>
      </div>
    </div>
  );
}
