"use client";

import React, { useState } from "react";
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  Database, 
  Radio, 
  Code2, 
  Sparkles,
  Zap
} from "lucide-react";
import { getPostGisDedupQuery } from "@/lib/spatial";

interface TerminalInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TerminalInspector: React.FC<TerminalInspectorProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"api" | "postgis" | "socket" | "cron">("postgis");
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const samplePostGisSql = getPostGisDedupQuery(11.2588, 75.7680, 50);

  const sampleApiResponse = JSON.stringify(
    {
      success: true,
      ticketNumber: "CIV-1401",
      spatialDedup: {
        isDuplicate: false,
        radiusCheckedMeters: 50,
        nearestActiveIncident: null,
      },
      aiScoring: {
        category: "WASTE_DUMPING",
        confidence: 0.94,
        confidenceFloorPassed: true,
        privacyRedacted: true,
        compressionRatio: "88.5%",
      },
      routing: {
        assignedWard: 14,
        zone: "Coastal Central",
        officer: "K. V. Suresh Kumar",
        slaDeadline: new Date(Date.now() + 86400000).toISOString(),
      },
    },
    null,
    2
  );

  const sampleSocketEvents = `
// Simulated Real-Time Socket.io Stream:
[2026-09-19T12:45:01.120Z] socket.connect -> client_id: "soc_kozhikode_9921"
[2026-09-19T12:45:01.350Z] socket.emit("incident:ingest", { ward: 14, cat: "WASTE_DUMPING" })
[2026-09-19T12:45:01.492Z] socket.broadcast.to("ward:14").emit("sla:tick", { remainingHours: 23.8 })
[2026-09-19T12:45:02.010Z] socket.emit("audit:append", { action: "AI_CONFIDENCE_VERIFIED", score: 0.94 })
  `.trim();

  const sampleCronPayload = `
// Vercel Cron Dispatch: GET /api/cron/sla-escalation
// Schedule: 0 * * * * (Hourly automated municipal sweep)
{
  "cronExecutionId": "cron-sla-sweep-20260919",
  "status": "COMPLETED_SUCCESS",
  "auditTimestamp": "${new Date().toISOString()}",
  "scannedActiveTickets": 6,
  "escalatedOverdueCount": 1,
  "escalatedTickets": ["CIV-1205"],
  "dispatchNotice": "Alert pushed to Kozhikode Municipal Director (Rojan Jose)"
}
  `.trim();

  const getCurrentContent = () => {
    switch (activeTab) {
      case "postgis":
        return samplePostGisSql.trim();
      case "api":
        return sampleApiResponse;
      case "socket":
        return sampleSocketEvents;
      case "cron":
        return sampleCronPayload;
      default:
        return "";
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-[#070912] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-lg text-white">
                Developer &amp; Systems Terminal
              </h3>
              <p className="text-xs text-slate-400">
                Live PostGIS queries, API payloads, Socket.io events, and Vercel Cron audits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between mt-4 mb-3 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("postgis")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeTab === "postgis"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              PostGIS SQL
            </button>

            <button
              onClick={() => setActiveTab("api")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeTab === "api"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              API Ingestion Payload
            </button>

            <button
              onClick={() => setActiveTab("socket")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeTab === "socket"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Socket.io Stream
            </button>

            <button
              onClick={() => setActiveTab("cron")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeTab === "cron"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Vercel Cron (/api/cron/sla-escalation)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs font-mono text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/20 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied!" : "Copy Payload"}</span>
          </button>
        </div>

        {/* Code View Canvas */}
        <div className="p-4 rounded-xl bg-black/90 border border-white/10 font-mono text-xs text-cyan-300 overflow-x-auto max-h-[340px] leading-relaxed shadow-inner">
          <pre>{getCurrentContent()}</pre>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Architecture: Next.js 14 App Router + Vercel Serverless Functions</span>
          <span className="text-cyan-400 font-semibold">Kozhikode Municipal Dispatch Engine</span>
        </div>
      </div>
    </div>
  );
};
