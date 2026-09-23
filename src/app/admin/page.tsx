"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { User, AuthorityStatus } from "@/lib/types";
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  BadgeCheck,
  RefreshCw,
  Search,
  Sliders,
  FileCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function AdminPortalPage() {
  const { user, token, isAdmin } = useAuth();
  const [authorities, setAuthorities] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleCounts, setRoleCounts] = useState({ CITIZEN: 0, OFFICER: 0, ADMIN: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"APPROVALS" | "USERS">("APPROVALS");
  const [searchUser, setSearchUser] = useState("");

  const fetchAdminData = async () => {
    if (!token) return;
    setIsLoading(true);
    setActionMessage(null);

    try {
      // 1. Fetch Authorities queue
      const authRes = await fetch("/api/admin/authorities?status=ALL", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        setAuthorities(authData.authorities || []);
      }

      // 2. Fetch Users directory
      const usersRes = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users || []);
        setTotalUsers(usersData.totalUsers || 0);
        setRoleCounts(usersData.roleCounts || { CITIZEN: 0, OFFICER: 0, ADMIN: 0 });
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleUpdateAuthority = async (userId: string, newStatus: AuthorityStatus) => {
    if (!token) return;
    setActionLoading(userId);
    setActionMessage(null);

    try {
      const res = await fetch("/api/admin/authorities", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || `Authority status updated to ${newStatus}.`);
        await fetchAdminData();
      } else {
        setActionMessage(data.error || "Failed to update authority account.");
      }
    } catch (err) {
      setActionMessage("Network error while updating status.");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingAuthorities = authorities.filter((a) => a.authorityStatus === "PENDING");
  const approvedAuthorities = authorities.filter((a) => a.authorityStatus === "APPROVED");

  const filteredUsers = allUsers.filter((u) => {
    if (!searchUser.trim()) return true;
    const q = searchUser.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>MUNICIPAL ADMINISTRATION & SECURITY GOVERNANCE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Administrator Console
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Verify municipal authority credentials, manage system roles, and inspect civic user records.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="self-start md:self-auto min-h-[44px] px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-purple-500/20"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Action status message */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-purple-800 dark:text-purple-300 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-semibold">{actionMessage}</p>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            Pending Approvals
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400">
              {pendingAuthorities.length}
            </span>
            <span className="text-xs text-slate-500">awaiting review</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            Active Authorities
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
              {approvedAuthorities.length}
            </span>
            <span className="text-xs text-slate-500">verified officers</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            Registered Citizens
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {roleCounts.CITIZEN}
            </span>
            <span className="text-xs text-slate-500">civic reporters</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            System Administrators
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-purple-600 dark:text-purple-400">
              {roleCounts.ADMIN}
            </span>
            <span className="text-xs text-slate-500">directors</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("APPROVALS")}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "APPROVALS"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          <span>Authority Approvals ({pendingAuthorities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "USERS"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({allUsers.length})</span>
        </button>
      </div>

      {/* TAB 1: Authority Approvals Queue */}
      {activeTab === "APPROVALS" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Pending Authority Accounts Verification
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Review applicant municipal organization and designation credentials before granting officer access.
            </p>
          </div>

          <div className="space-y-4">
            {authorities.map((auth) => {
              const isPending = auth.authorityStatus === "PENDING";
              const isApproved = auth.authorityStatus === "APPROVED";
              const isRejected = auth.authorityStatus === "REJECTED";

              return (
                <div
                  key={auth.id}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{auth.name}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isPending
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300"
                            : isApproved
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                            : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300"
                        }`}
                      >
                        {auth.authorityStatus || "PENDING"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <p><strong>Email:</strong> {auth.email}</p>
                      <p><strong>Organization:</strong> {auth.organization || "N/A"}</p>
                      <p><strong>Department:</strong> {auth.department || "N/A"}</p>
                      <p><strong>Designation:</strong> {auth.designation || "N/A"}</p>
                      <p><strong>Employee ID:</strong> {auth.employeeId || "N/A"}</p>
                      <p><strong>Assigned Ward:</strong> Ward {auth.wardId || "14"}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleUpdateAuthority(auth.id, "APPROVED")}
                        disabled={actionLoading === auth.id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {!isRejected && (
                      <button
                        type="button"
                        onClick={() => handleUpdateAuthority(auth.id, "REJECTED")}
                        disabled={actionLoading === auth.id}
                        className="px-3.5 py-2 rounded-xl bg-red-100 dark:bg-red-950/50 hover:bg-red-200 text-red-700 dark:text-red-300 text-xs font-bold border border-red-200 dark:border-red-900 flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {authorities.length === 0 && (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <p className="font-semibold text-sm">No authority accounts found in queue.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: All Users Directory */}
      {activeTab === "USERS" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Civion User Directory
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                All registered accounts across Citizen, Authority, and Administration roles.
              </p>
            </div>

            <div className="relative sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user name or email…"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Email Status</th>
                  <th className="pb-3 pr-4">Authority Status</th>
                  <th className="pb-3">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{u.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200"
                            : u.role === "OFFICER"
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200"
                            : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200"
                        }`}
                      >
                        {u.role === "OFFICER" ? "AUTHORITY" : u.role}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-xs font-semibold">
                      {u.emailVerified ? (
                        <span className="text-emerald-600 dark:text-emerald-400">✓ Verified</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">⏳ Unverified</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-xs">
                      {u.role === "OFFICER" ? (
                        <span className="font-bold text-slate-700 dark:text-slate-300">{u.authorityStatus || "PENDING"}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 text-xs text-slate-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "Seed"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
