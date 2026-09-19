"use client";

import React, { useState, useEffect } from "react";
import { Role, Incident, Ward, User } from "@/lib/types";
import { DEMO_USERS, SEED_INCIDENTS, SEED_WARDS } from "@/lib/seed-data";
import { Navbar } from "@/components/layout/Navbar";
import { QuickDemoBanner } from "@/components/layout/QuickDemoBanner";
import { HeroSection } from "@/components/landing/HeroSection";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { ProtocolPipeline } from "@/components/landing/ProtocolPipeline";
import { KozhikodeMap } from "@/components/map/KozhikodeMap";
import { ImageComparisonSlider } from "@/components/incidents/ImageComparisonSlider";
import { IncidentSubmitModal } from "@/components/incidents/IncidentSubmitModal";
import { MunicipalExportPanel } from "@/components/analytics/MunicipalExportPanel";
import { TerminalInspector } from "@/components/console/TerminalInspector";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Building2, 
  RefreshCw, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  UploadCloud,
  Check
} from "lucide-react";

export default function CivionHomePage() {
  const [currentRole, setCurrentRole] = useState<Role>("CITIZEN");
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS.citizen);
  const [incidents, setIncidents] = useState<Incident[]>(SEED_INCIDENTS);
  const [wards, setWards] = useState<Ward[]>(SEED_WARDS);
  const [selectedIncident, setSelectedIncident] = useState<Incident>(SEED_INCIDENTS[0]);

  // Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "warning" | "info";
  } | null>(null);

  // Officer resolution action states
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  // Switch roles for judging mode
  const handleRoleChange = async (role: Role) => {
    setCurrentRole(role);
    const roleKey = role === "CITIZEN" ? "citizen" : role === "OFFICER" ? "officer" : "admin";
    setCurrentUser(DEMO_USERS[roleKey]);

    setToastMessage({
      text: `Switched session to ${role} Mode (${DEMO_USERS[roleKey].name}). Role Immutability active.`,
      type: "info",
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleIncidentSubmitSuccess = (
    newInc: Incident,
    isDuplicate: boolean,
    duplicateMessage?: string
  ) => {
    setIncidents((prev) => [newInc, ...prev]);
    setSelectedIncident(newInc);

    setToastMessage({
      text: isDuplicate
        ? `Spatial Duplicate Detected: ${duplicateMessage}`
        : `Ticket ${newInc.ticketNumber} ingested & dispatched to Ward ${newInc.wardNumber} Officer.`,
      type: isDuplicate ? "warning" : "success",
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Officer action: Mark ticket as resolved
  const handleResolveIncident = async (incidentId: string) => {
    setIsResolving(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          resolvedNotes: resolutionNotes || "Ward officer repair squad completed resurfacing and clearance.",
          resolutionPhotoUrl:
            "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80",
          actorRole: currentRole,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIncidents((prev) =>
          prev.map((i) => (i.id === incidentId ? data.incident : i))
        );
        setSelectedIncident(data.incident);
        setToastMessage({
          text: `Ticket ${data.incident.ticketNumber} marked as RESOLVED with repair proof.`,
          type: "success",
        });
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolving(false);
    }
  };

  // Admin action: trigger SLA cron
  const handleTriggerSlaCron = async () => {
    try {
      const res = await fetch("/api/cron/sla-escalation");
      const data = await res.json();
      setToastMessage({
        text: `Vercel Cron Triggered: ${data.message}`,
        type: data.escalatedCount > 0 ? "warning" : "success",
      });
      setTimeout(() => setToastMessage(null), 5000);

      // Refresh list
      const fetchInc = await fetch("/api/incidents");
      const incData = await fetchInc.json();
      if (incData.incidents) {
        setIncidents(incData.incidents);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Quick Demo Pitch Header */}
      <QuickDemoBanner
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
      />

      {/* Global Navigation Header */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        activeSection="home"
      />

      {/* Notification Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-md animate-bounce">
          <div
            className={`p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-3 ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : toastMessage.type === "warning"
                ? "bg-amber-950/90 border-amber-500/50 text-amber-200"
                : "bg-cyan-950/90 border-cyan-500/50 text-cyan-200"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : toastMessage.type === "warning" ? (
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            )}
            <div className="text-xs font-medium leading-relaxed">
              {toastMessage.text}
            </div>
          </div>
        </div>
      )}

      {/* Main Sections */}
      <main>
        {/* 1. Hero Section with ProtoX Lighting */}
        <HeroSection
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onExploreMap={() => {
            const el = document.getElementById("map-section");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* 2. Interactive Bento Grid with ProtoX Spotlight Mouse Tracking */}
        <BentoGrid />

        {/* 3. The 5-Stage Ingestion Pipeline */}
        <ProtocolPipeline />

        {/* 4. Live Kozhikode PostGIS Map View */}
        <KozhikodeMap
          incidents={incidents}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          selectedIncidentId={selectedIncident?.id}
        />

        {/* 5. Before/After Resolution Slider & Officer Action Dispatch Center */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>GROUND-TRUTH VERIFICATION</span>
            </div>
            <h2 className="font-syne text-3xl sm:text-4xl font-extrabold text-white">
              Before / After Resolution Verification
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Tamper-proof visual comparison slider of citizen proof vs. officer repair certification.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 2-Columns Slider */}
            <div className="lg:col-span-2">
              {selectedIncident && (
                <ImageComparisonSlider
                  beforeImageUrl={selectedIncident.citizenPhotoUrl}
                  afterImageUrl={
                    selectedIncident.resolutionPhotoUrl ||
                    "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80"
                  }
                  ticketNumber={selectedIncident.ticketNumber}
                  title={selectedIncident.title}
                  resolutionNotes={selectedIncident.resolvedNotes}
                  officerName={selectedIncident.assignedOfficerName}
                  resolvedDate={selectedIncident.resolvedAt}
                />
              )}
            </div>

            {/* Role Action Panel (Dynamic based on selected role) */}
            <div className="rounded-2xl bg-[#090d1a] border border-white/10 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <span className="font-syne font-bold text-sm text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    Role-Scoped Action Portal
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 uppercase font-semibold">
                    {currentRole} ACTIVE
                  </span>
                </div>

                <div className="space-y-4 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[11px] font-mono text-slate-400 block mb-1">
                      SELECTED INCIDENT:
                    </span>
                    <strong className="text-white text-sm block">
                      {selectedIncident?.ticketNumber}: {selectedIncident?.title}
                    </strong>
                    <p className="text-slate-400 text-[11px] mt-1">
                      Ward {selectedIncident?.wardNumber} • {selectedIncident?.address}
                    </p>
                  </div>

                  {/* OFFICER ACTIONS */}
                  {currentRole === "OFFICER" && (
                    <div className="space-y-3 pt-2">
                      <label className="block font-mono text-[11px] text-indigo-300 font-semibold">
                        OFFICER REPAIR NOTES / CERTIFICATION:
                      </label>
                      <textarea
                        rows={3}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Enter repair notes: e.g. Hot mix asphalt applied, compaction tested."
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-400"
                      />
                      <button
                        onClick={() => handleResolveIncident(selectedIncident.id)}
                        disabled={isResolving}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Upload Resolution Proof &amp; Mark Resolved</span>
                      </button>
                    </div>
                  )}

                  {/* ADMIN ACTIONS */}
                  {currentRole === "ADMIN" && (
                    <div className="space-y-3 pt-2">
                      <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                        <span className="font-mono text-[11px] text-purple-300 font-bold block mb-1">
                          DIRECTOR SLA AUTOMATION:
                        </span>
                        <p className="text-[11px] text-slate-300">
                          Manually trigger the hourly Vercel Cron sweep to audit overdue SLA tickets.
                        </p>
                      </div>
                      <button
                        onClick={handleTriggerSlaCron}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Execute SLA Escalation Audit</span>
                      </button>
                    </div>
                  )}

                  {/* CITIZEN ACTIONS */}
                  {currentRole === "CITIZEN" && (
                    <div className="space-y-3 pt-2">
                      <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                        <span className="font-mono text-[11px] text-cyan-300 font-bold block mb-1">
                          CITIZEN TRANSPARENCY:
                        </span>
                        <p className="text-[11px] text-slate-300">
                          Your submission has been verified by the AI pipeline with zero PII leakage.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Report Another Ward Issue</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 text-center">
                <span className="text-[11px] font-mono text-slate-500">
                  Switch roles anytime in the top Pitch Header
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modals & Terminal Drawer */}
      <IncidentSubmitModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitSuccess={handleIncidentSubmitSuccess}
        currentUser={currentUser}
      />

      <MunicipalExportPanel
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        incidents={incidents}
        wards={wards}
      />

      <TerminalInspector
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-20 border-t border-white/10 bg-[#04060b] py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-syne font-bold text-base text-white tracking-wider">
              CIVION
            </span>
            <span className="text-slate-600">|</span>
            <span>Real People. Real Photos. Healthier Cities.</span>
          </div>

          <div className="text-center sm:text-right">
            <div>
              Created &amp; Architected by <strong className="text-cyan-400 font-semibold">Rojan Jose</strong>
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              GitHub: <span className="font-mono text-slate-400">codiing-5/civion-platform</span> • Vercel Ready
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
