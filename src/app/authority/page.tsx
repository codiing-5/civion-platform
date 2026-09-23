"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Incident, Ward, Status, Category, getCitizenStatus } from "@/lib/types";
import {
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  MapPin,
  Filter,
  Search,
  ArrowUpRight,
  Shield,
  Layers,
  ChevronRight,
  UserCheck,
  RefreshCw,
  PlusCircle,
  Sparkles,
} from "lucide-react";

export default function AuthorityPortalPage() {
  const { user, token } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected incident for modal / quick action
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const fetchAuthorityData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/incidents");
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
      }
    } catch (err) {
      console.error("Failed to load authority incidents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorityData();
  }, []);

  // Update status handler
  const handleUpdateStatus = async (incidentId: string, newStatus: Status) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          resolvedNotes: newStatus === "RESOLVED" ? resolutionNotes || "Resolved by Municipal Ward Team" : undefined,
          actorRole: "OFFICER",
        }),
      });

      if (res.ok) {
        await fetchAuthorityData();
        setSelectedIncident(null);
        setResolutionNotes("");
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Metrics
  const openCount = incidents.filter((i) => i.status === "SUBMITTED" || i.status === "AI_VERIFIED").length;
  const inProgressCount = incidents.filter((i) => i.status === "DISPATCHED" || i.status === "IN_PROGRESS").length;
  const escalatedCount = incidents.filter((i) => i.status === "ESCALATED_SLA").length;
  const resolvedCount = incidents.filter((i) => i.status === "RESOLVED").length;

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (statusFilter !== "ALL" && inc.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && inc.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.ticketNumber.toLowerCase().includes(q) ||
        inc.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>AUTHORITY OPERATIONS DESK • WARD {user?.wardId || 14}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Municipal Ward Management
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Welcome, {user?.name || "Officer"}. Monitor civic issues, assign crews, and track resolution SLAs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            href="/map"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>Live Map</span>
          </Link>
          <button
            onClick={fetchAuthorityData}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Open / Received
            </span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 text-sm">⏳</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {openCount}
            </span>
            <span className="text-xs font-medium text-slate-500">pending review</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              In Progress
            </span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 text-sm">🛠️</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400">
              {inProgressCount}
            </span>
            <span className="text-xs font-medium text-slate-500">crews active</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              SLA Breached
            </span>
            <span className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 text-sm">🚨</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-extrabold text-red-600 dark:text-red-400">
              {escalatedCount}
            </span>
            <span className="text-xs font-medium text-red-500">urgent priority</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Resolved
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-sm">✅</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {resolvedCount}
            </span>
            <span className="text-xs font-medium text-emerald-600">closed issues</span>
          </div>
        </div>
      </div>

      {/* Main Issue Management Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Civic Incidents Queue
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {filteredIncidents.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket or landmark…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ESCALATED_SLA">SLA Escalated</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-4">Ticket</th>
                <th className="pb-3 pr-4">Problem</th>
                <th className="pb-3 pr-4">Location</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Reported</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredIncidents.map((inc) => {
                const statusInfo = getCitizenStatus(inc.status);
                return (
                  <tr key={inc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 pr-4 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                      {inc.ticketNumber}
                    </td>
                    <td className="py-4 pr-4 max-w-xs">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{inc.title}</p>
                      <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {inc.category.toLowerCase().replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {inc.address}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}
                      >
                        <span>{statusInfo.icon}</span>
                        <span>{statusInfo.label}</span>
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(inc.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors"
                      >
                        Manage Status
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredIncidents.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <p className="font-semibold text-sm">No incidents match your current filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Status Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {selectedIncident.ticketNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedIncident.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <p><strong>Address:</strong> {selectedIncident.address}</p>
              <p><strong>Current Status:</strong> {selectedIncident.status}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Update Status to:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedIncident.id, "DISPATCHED")}
                  disabled={updatingStatus}
                  className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-900 transition-colors"
                >
                  🛠️ Dispatched
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedIncident.id, "IN_PROGRESS")}
                  disabled={updatingStatus}
                  className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-900 transition-colors"
                >
                  ⚡ In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedIncident.id, "RESOLVED")}
                  disabled={updatingStatus}
                  className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900 transition-colors"
                >
                  ✅ Resolved
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Resolution Notes / Team Memo (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Details of repair or action taken…"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
