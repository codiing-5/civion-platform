"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Briefcase,
  BadgeCheck,
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  Sparkles,
} from "lucide-react";

export default function ProfilePage() {
  const { user, changePassword, isCitizen, isAuthority, isAdmin } = useAuth();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }

    if (!isPasswordValid) {
      setPasswordError("New password must meet all security requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    const res = await changePassword(currentPassword, newPassword, confirmPassword);
    setIsUpdatingPassword(false);

    if (!res.success) {
      setPasswordError(res.error || "Failed to update password.");
      return;
    }

    setPasswordSuccess("Password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const roleLabel = isAdmin
    ? "Municipal Administrator"
    : isAuthority
    ? "Authority / Municipal Staff"
    : "Citizen Member";

  const roleBadgeColor = isAdmin
    ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
    : isAuthority
    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
    : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";

  return (
    <div className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Account Profile & Security
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Manage your account credentials and personal preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-500/20">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {user?.name || "User"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${roleBadgeColor}`}
          >
            {roleLabel}
          </span>

          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span>Email Status:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
            {isAuthority && user?.authorityStatus && (
              <div className="flex items-center justify-between">
                <span>Authority Status:</span>
                <span
                  className={`font-bold ${
                    user.authorityStatus === "APPROVED"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {user.authorityStatus}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Account Details & Password Change */}
        <div className="md:col-span-2 space-y-6">
          {/* Official / Account Details Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-blue-600" />
              <span>Personal Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                  Full Name
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{user?.name}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                  Email Address
                </span>
                <span className="font-bold text-slate-900 dark:text-white break-all">{user?.email}</span>
              </div>

              {user?.phone && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                    Phone Number
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{user.phone}</span>
                </div>
              )}

              {isAuthority && (
                <>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                      Organization
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {user?.organization || "Kozhikode Municipal Corporation"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                      Department
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {user?.department || "Public Works"}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                      Designation
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {user?.designation || "Ward Engineer"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Change Password Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <span>Change Password</span>
            </h2>

            {passwordError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-medium">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div
                role="status"
                className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-medium">{passwordSuccess}</p>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full min-h-[46px] px-3.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full min-h-[46px] px-3.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength Meter Bar */}
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">Strength:</span>
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword || !newPassword || !confirmPassword || !isPasswordValid || !passwordsMatch}
                className="min-h-[46px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>{isUpdatingPassword ? "Updating password…" : "Update Password"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
