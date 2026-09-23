"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Clock,
  Building2,
  ShieldCheck,
  RefreshCw,
  LogOut,
  BadgeCheck,
  Building,
  Briefcase,
  IdCard,
} from "lucide-react";

export default function PendingApprovalPage() {
  const { user, refreshUser, logout, isAuthority } = useAuth();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    await refreshUser();
    setIsRefreshing(false);

    if (user?.authorityStatus === "APPROVED") {
      router.replace("/authority");
    } else {
      setRefreshMessage("Your application is still undergoing review by municipal administrators.");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6 bg-white dark:bg-[#111827] p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center transition-colors animate-in zoom-in-95">
        {/* Pending Badge Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-4xl shadow-md shadow-amber-500/10">
          ⏳
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 mb-3 border border-amber-200 dark:border-amber-800">
            <span>Pending Administrator Verification</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Account Under Review
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Your authority account has been registered and verified. An administrator is reviewing your official credentials before activating municipal portal access.
          </p>
        </div>

        {/* Authority Details Summary */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Official Name:</span>
            <span className="font-bold text-slate-900 dark:text-white">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Email:</span>
            <span className="font-bold text-slate-900 dark:text-white">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Organization:</span>
            <span className="font-bold text-slate-900 dark:text-white">{user?.organization || "Kozhikode Municipal Corporation"}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Department:</span>
            <span className="font-bold text-slate-900 dark:text-white">{user?.department || "Public Works"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Designation:</span>
            <span className="font-bold text-slate-900 dark:text-white">{user?.designation || "Ward Official"}</span>
          </div>
        </div>

        {refreshMessage && (
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
            {refreshMessage}
          </p>
        )}

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isRefreshing}
            className="w-full min-h-[50px] px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Checking status…" : "Check Approval Status"}</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full min-h-[48px] px-6 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
