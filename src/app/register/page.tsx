"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/lib/types";
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Check,
  X,
  Building,
  Briefcase,
  BadgeCheck,
  FileCheck,
} from "lucide-react";

function RegisterForm() {
  const { register, verifyEmail, sendVerificationOtp, user, isLoading, isAuthority, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Multi-step registration state: "FORM" | "VERIFY"
  const [step, setStep] = useState<"FORM" | "VERIFY">("FORM");

  // Form inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Role: CITIZEN or OFFICER (Authority)
  const [selectedRole, setSelectedRole] = useState<Role>("CITIZEN");

  // Authority specific inputs
  const [organization, setOrganization] = useState("Kozhikode Municipal Corporation");
  const [department, setDepartment] = useState("Public Works & Infrastructure");
  const [designation, setDesignation] = useState("Ward Technical Officer");
  const [employeeId, setEmployeeId] = useState("");
  const [wardNumber, setWardNumber] = useState<number>(14);

  // Terms agreement
  const [agreeTerms, setAgreeTerms] = useState(false);

  // OTP Verification state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Check URL params for prefilled email & step
  useEffect(() => {
    const emailParam = searchParams.get("email");
    const stepParam = searchParams.get("step");
    if (emailParam) setEmail(emailParam);
    if (stepParam === "verify") setStep("VERIFY");
  }, [searchParams]);

  // If already logged in, redirect
  useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin) router.replace("/admin");
      else if (isAuthority) router.replace(user.authorityStatus === "PENDING" ? "/pending-approval" : "/authority");
      else router.replace("/dashboard");
    }
  }, [user, isLoading, router, isAdmin, isAuthority]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus OTP box on step transition
  useEffect(() => {
    if (step === "VERIFY") {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Password strength calculations
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

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
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Handle Form Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage("Please choose a stronger password meeting all listed requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (selectedRole === "OFFICER") {
      if (!organization.trim() || !department.trim() || !designation.trim()) {
        setErrorMessage("Please provide your organization, department, and designation details.");
        return;
      }
    }

    if (!agreeTerms) {
      setErrorMessage("Please agree to the Terms of Service & Privacy Policy to continue.");
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
      role: selectedRole,
      phone: phone.trim() || undefined,
      organization: selectedRole === "OFFICER" ? organization.trim() : undefined,
      department: selectedRole === "OFFICER" ? department.trim() : undefined,
      designation: selectedRole === "OFFICER" ? designation.trim() : undefined,
      employeeId: selectedRole === "OFFICER" ? employeeId.trim() || undefined : undefined,
      wardId: selectedRole === "OFFICER" ? wardNumber : undefined,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Registration failed. Please check your information.");
      return;
    }

    setCooldown(res.cooldownSeconds || 60);
    if (res.devOtp) setDevOtpCode(res.devOtp);
    setStep("VERIFY");
    setSuccessNotice("We have sent a 6-digit verification code to your email.");
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

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsSubmitting(true);
    const res = await verifyEmail(email.trim().toLowerCase(), otpCode, fullName.trim());
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "The verification code is invalid or has expired.");
      return;
    }

    if (res.isPendingAuthority) {
      router.replace("/pending-approval");
    } else {
      router.replace(res.portalUrl || "/dashboard");
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsSubmitting(true);

    const res = await sendVerificationOtp(email.trim().toLowerCase());
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Unable to resend verification code.");
      return;
    }

    setCooldown(res.cooldownSeconds || 60);
    if (res.devOtp) setDevOtpCode(res.devOtp);
    setSuccessNotice("A fresh 6-digit verification code has been sent.");
  };

  const fullOtpString = otp.join("");

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl space-y-6 bg-white dark:bg-[#111827] p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {step === "FORM" ? "Create your Civion account" : "Verify your email address"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            {step === "FORM"
              ? "Join the civic platform for community issue reporting and ward management"
              : `We sent a 6-digit verification code to ${email}`}
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

        {/* STEP 1: Registration Form */}
        {step === "FORM" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            {/* Role Selection Cards */}
            <div className="space-y-2.5">
              <label className="block text-sm font-bold text-slate-900 dark:text-slate-200">
                Choose your account role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Citizen Role */}
                <button
                  type="button"
                  onClick={() => setSelectedRole("CITIZEN")}
                  className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between focus:outline-none ${
                    selectedRole === "CITIZEN"
                      ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">👤</span>
                    {selectedRole === "CITIZEN" && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Citizen</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Report local problems, track resolutions, and improve your neighbourhood.
                    </p>
                  </div>
                </button>

                {/* Authority / Municipal Staff Role */}
                <button
                  type="button"
                  onClick={() => setSelectedRole("OFFICER")}
                  className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between focus:outline-none ${
                    selectedRole === "OFFICER"
                      ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🏛️</span>
                    {selectedRole === "OFFICER" && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Authority / Municipal Staff
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Manage civic issues, monitor wards, and coordinate ground resolution.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="reg-name"
                  className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-1.5"
                >
                  Full name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    placeholder="e.g. Rohan Nair"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="reg-email"
                  className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Phone (Optional) */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="reg-phone"
                  className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-1.5"
                >
                  Phone number <span className="text-xs font-normal text-slate-500">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="+91 98470 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Authority Specific Fields */}
            {selectedRole === "OFFICER" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <BadgeCheck className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-bold">Authority & Organization Details</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Authority accounts require administrative approval before gaining operational management access.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Municipality / Organization
                    </label>
                    <input
                      type="text"
                      required
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Kozhikode Municipal Corporation"
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Public Works / Sanitation"
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Designation / Role
                    </label>
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Executive Engineer / Inspector"
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Employee / Official ID <span className="font-normal text-slate-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g. KMC-ENG-2024"
                      className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password Section with Real-Time Strength Meter */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Password */}
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-[48px] pl-10 pr-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength Meter Bar */}
                {password.length > 0 && (
                  <div className="mt-2.5 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">Password strength:</span>
                      <span className={strengthColor}>{strengthLabel}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strengthColor} transition-all duration-300 ${strengthWidth}`}
                      />
                    </div>
                  </div>
                )}

                {/* Password Requirements Checklist */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div
                    className={`flex items-center gap-1.5 ${
                      minLength
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {minLength ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 text-center leading-none">•</span>}
                    <span>At least 8 characters</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasUpper
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {hasUpper ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 text-center leading-none">•</span>}
                    <span>Uppercase letter (A-Z)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasLower
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {hasLower ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 text-center leading-none">•</span>}
                    <span>Lowercase letter (a-z)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasNumber
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {hasNumber ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 text-center leading-none">•</span>}
                    <span>Number (0-9)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 sm:col-span-2 ${
                      hasSpecial
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {hasSpecial ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 text-center leading-none">•</span>}
                    <span>Special character (!@#$%^&*)</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-1.5"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full min-h-[48px] pl-10 pr-12 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      confirmPassword && !passwordsMatch
                        ? "border-red-400 focus:ring-red-500"
                        : confirmPassword && passwordsMatch
                        ? "border-emerald-500 focus:ring-emerald-500"
                        : "border-slate-300 dark:border-slate-700"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p
                    className={`mt-1.5 text-xs font-semibold flex items-center gap-1 ${
                      passwordsMatch
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>Passwords do not match</span>
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Terms and Privacy Agreement */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span>
                  I accept the Civion{" "}
                  <span className="text-blue-600 dark:text-blue-400 underline">Terms of Service</span> and{" "}
                  <span className="text-blue-600 dark:text-blue-400 underline">Privacy Policy</span>.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !fullName || !email || !isPasswordValid || !passwordsMatch || !agreeTerms}
              className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>{isSubmitting ? "Creating account…" : "Register and Verify Email"}</span>
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        )}

        {/* STEP 2: Email Verification OTP */}
        {step === "VERIFY" && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="otp-0"
                className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-3 text-center"
              >
                Enter 6-digit verification code
              </label>

              {/* 6 Individual Digit Inputs */}
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

              {/* Dev Mode Helper */}
              {devOtpCode && (
                <div className="mt-3.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between animate-in fade-in">
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
                <span>{isSubmitting ? "Verifying…" : "Complete Verification"}</span>
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
                    setStep("FORM");
                    setErrorMessage(null);
                  }}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Edit details
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Existing account link */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

