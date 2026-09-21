"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Mail,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Building2,
  User as UserIcon,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const { user, sendEmailOtp, verifyEmailOtp, isLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"EMAIL" | "OTP" | "NAME">("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [fullName, setFullName] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  // Handle countdown interval for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first OTP input when transitioning to OTP step
  useEffect(() => {
    if (step === "OTP") {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const validateEmailFormat = (val: string) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(val.trim().toLowerCase());
  };

  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!validateEmailFormat(cleanEmail)) {
      setErrorMessage("Please enter a valid email address (e.g. user@example.com).");
      return;
    }

    setIsSubmitting(true);
    const res = await sendEmailOtp(cleanEmail);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Unable to send verification code. Please try again.");
      return;
    }

    setIsExistingUser(!!res.isExistingUser);
    setCooldown(res.cooldownSeconds || 60);
    if (res.devOtp) {
      setDemoOtpCode(res.devOtp);
    }
    setStep("OTP");
    setOtp(["", "", "", "", "", ""]);
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsSubmitting(true);

    const res = await sendEmailOtp(email.trim().toLowerCase());
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Unable to resend verification code.");
      return;
    }

    setCooldown(res.cooldownSeconds || 60);
    if (res.devOtp) {
      setDemoOtpCode(res.devOtp);
    }
    setSuccessNotice("A fresh verification code has been generated.");
  };

  const fillDemoOtp = () => {
    if (demoOtpCode) {
      const digits = demoOtpCode.split("").slice(0, 6);
      setOtp(digits);
      setErrorMessage(null);
    }
  };

  // Handle individual OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    // Keep only numbers
    const cleanDigit = value.replace(/\D/g, "");

    if (cleanDigit.length > 1) {
      // User pasted into a single digit box
      handleOtpPaste(cleanDigit);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanDigit;
    setOtp(newOtp);
    if (errorMessage) setErrorMessage(null);

    // Auto-advance to next box if filled
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

    // Focus on the next available box or the last box
    const nextIndex = Math.min(digits.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the verification code.");
      return;
    }

    if (!isExistingUser && step === "OTP") {
      // Prompt for name for new users
      setStep("NAME");
      return;
    }

    await executeVerification(otpCode);
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    await executeVerification(otp.join(""), fullName.trim());
  };

  const executeVerification = async (otpCode: string, nameToSave?: string) => {
    setIsSubmitting(true);
    const res = await verifyEmailOtp(email.trim().toLowerCase(), otpCode, nameToSave || fullName);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "The code entered is invalid or has expired.");
      return;
    }

    router.replace("/dashboard");
  };

  const fullOtpString = otp.join("");

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-[#111827] p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {step === "EMAIL" && "Sign in to Civion"}
            {step === "OTP" && "Check your email"}
            {step === "NAME" && "What is your name?"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {step === "EMAIL" && "Enter your email address to receive a verification code."}
            {step === "OTP" && (
              <span>
                We sent a 6-digit verification code to{" "}
                <strong className="text-slate-900 dark:text-slate-200 font-semibold">{email}</strong>
              </span>
            )}
            {step === "NAME" && "Help municipal ward officers address you correctly."}
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

        {/* Step 1: Email Input */}
        {step === "EMAIL" && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
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

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>{isSubmitting ? "Sending verification code…" : "Send verification code"}</span>
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        )}

        {/* Step 2: 6-Digit OTP Input */}
        {step === "OTP" && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="otp-0"
                className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-3 text-center"
              >
                Enter 6-digit verification code
              </label>

              {/* 6 Individual Digit Boxes with Auto-Focus and Paste Support */}
              <div
                className="flex items-center justify-between gap-2 sm:gap-3"
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
                    className="w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Dev mode helper when Gmail credentials are unconfigured */}
              {demoOtpCode && (
                <div className="mt-3.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between animate-in fade-in">
                  <div className="text-xs text-amber-900 dark:text-amber-200">
                    <span className="font-medium text-amber-700 dark:text-amber-400">Dev Code: </span>
                    <strong className="font-mono font-bold text-sm tracking-wider">
                      {demoOtpCode}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={fillDemoOtp}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || fullOtpString.length !== 6}
                className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>{isSubmitting ? "Verifying…" : "Verify and continue"}</span>
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
                    setOtp(["", "", "", "", "", ""]);
                    setErrorMessage(null);
                    setSuccessNotice(null);
                  }}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Change email
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 3: Full Name Input (New User Onboarding) */}
        {step === "NAME" && (
          <form onSubmit={handleNameSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name-input"
                className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-2"
              >
                Full name
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
                  className="w-full min-h-[52px] pl-12 pr-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !fullName.trim()}
              className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>{isSubmitting ? "Creating account…" : "Complete sign up"}</span>
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        )}

        {/* Privacy notice */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Your email is securely stored and never shared publicly.</span>
        </div>
      </div>
    </div>
  );
}
