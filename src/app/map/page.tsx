"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Incident, getCitizenStatus, Category } from "@/lib/types";
import {
  MapPin,
  Filter,
  Layers,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";

// Dynamically import map core to avoid SSR issues with Leaflet
const CommunityMapCore = dynamic(
  () => import("@/components/map/CommunityMapCore"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-semibold text-sm">Loading map…</p>
      </div>
    ),
  }
);

export default function LiveMapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Detect dark mode from document
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Fetch public community incidents
    const loadIncidents = async () => {
      try {
        const res = await fetch("/api/incidents");
        if (!res.ok) throw new Error("Failed to fetch community map incidents");
        const data = await res.json();
        setIncidents(data.incidents || []);
      } catch (err) {
        setFetchError("The map could not be loaded. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadIncidents();
    return () => observer.disconnect();
  }, []);

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    const statusInfo = getCitizenStatus(inc.status);

    if (statusFilter === "UNDER_REVIEW" && statusInfo.markerColor !== "red") return false;
    if (statusFilter === "ASSIGNED" && statusInfo.markerColor !== "yellow") return false;
    if (statusFilter === "RESOLVED" && statusInfo.markerColor !== "green") return false;

    if (categoryFilter !== "ALL" && inc.category !== categoryFilter) return false;

    return true;
  });

  return (
    <div className="flex-1 flex flex-col w-full py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Live Community Map</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            See reported problems and ongoing fixes across your community.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold p-2.5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span>Under Review</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Work Team Assigned</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Fixed</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === "ALL"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
          }`}
        >
          All ({incidents.length})
        </button>
        <button
          onClick={() => setStatusFilter("UNDER_REVIEW")}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === "UNDER_REVIEW"
              ? "bg-red-600 text-white shadow-sm"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
          }`}
        >
          Under Review
        </button>
        <button
          onClick={() => setStatusFilter("ASSIGNED")}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === "ASSIGNED"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
          }`}
        >
          Work Team Assigned
        </button>
        <button
          onClick={() => setStatusFilter("RESOLVED")}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === "RESOLVED"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
          }`}
        >
          Fixed
        </button>
      </div>

      {/* Map Card Container */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900 min-h-[500px] h-[72vh] flex flex-col">
        {fetchError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="font-semibold text-slate-200 text-base">{fetchError}</p>
          </div>
        ) : (
          <CommunityMapCore
            incidents={filteredIncidents}
            selectedIncidentId={selectedIncident?.id}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            isDarkMode={isDarkMode}
          />
        )}
      </div>

      {/* Privacy Notice */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Info className="w-4 h-4 shrink-0 text-blue-500" />
        <span>
          Reporter identity and contact numbers are protected and never shown on public markers.
        </span>
      </div>
    </div>
  );
}
