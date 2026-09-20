"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Incident, getCitizenStatus, Category } from "@/lib/types";
import {
  FileText,
  MapPin,
  Calendar,
  PlusCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const CATEGORY_ICONS: Record<Category, string> = {
  POTHOLE: "🕳️",
  WASTE_DUMPING: "🗑️",
  STREETLIGHT: "💡",
  WATER_LEAKAGE: "🚰",
  DRAINAGE: "🌊",
  OTHER: "✏️",
};

export default function MyReportsPage() {
  const { token, user } = useAuth();
  const [reports, setReports] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMyReports = async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/incidents?myReports=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Unable to fetch reports");
      }

      const data = await res.json();
      setReports(data.incidents || []);
    } catch (err) {
      setErrorMessage("Something went wrong while loading your reports. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, [token]);

  return (
    <div className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Submitted Reports
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Track the status of problems you have reported in your community.
          </p>
        </div>

        <Link
          href="/report"
          className="inline-flex min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Problem</span>
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Loading your reports…
          </p>
        </div>
      )}

      {/* Error state */}
      {errorMessage && !isLoading && (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            {errorMessage}
          </p>
          <button
            onClick={fetchMyReports}
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !errorMessage && reports.length === 0 && (
        <div className="py-16 px-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-4xl flex items-center justify-center mx-auto">
            📋
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              No reports yet
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              When you report a local problem, you'll see it here with live progress updates.
            </p>
          </div>
          <Link
            href="/report"
            className="inline-flex min-h-[50px] px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Report a local problem</span>
          </Link>
        </div>
      )}

      {/* Reports List */}
      {!isLoading && reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report) => {
            const statusInfo = getCitizenStatus(report.status);
            const icon = CATEGORY_ICONS[report.category] || "📍";

            return (
              <div
                key={report.id}
                className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col md:flex-row gap-5"
              >
                {/* Photo Thumbnail */}
                {report.citizenPhotoUrl && (
                  <div className="w-full md:w-44 h-40 md:h-auto rounded-2xl overflow-hidden bg-slate-900 shrink-0">
                    <img
                      src={report.citizenPhotoUrl}
                      alt={report.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Header line */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{icon}</span>
                        <span className="font-mono font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                          {report.ticketNumber}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}
                      >
                        <span>{statusInfo.icon}</span>
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                      {report.title}
                    </h2>

                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-2">
                      <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>{report.address}</span>
                    </p>
                  </div>

                  {/* Resolution notes if resolved */}
                  {report.status === "RESOLVED" && report.resolvedNotes && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                      <strong>Fix Update:</strong> {report.resolvedNotes}
                    </div>
                  )}

                  {/* Footer date & info */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Reported on{" "}
                      {new Date(report.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      {statusInfo.description}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
