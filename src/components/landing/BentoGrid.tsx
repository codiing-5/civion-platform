"use client";

import React, { useState, MouseEvent } from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Cpu, 
  MapPin, 
  Activity, 
  Layers, 
  Zap, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Compass, 
  Sliders,
  Sparkles
} from "lucide-react";
import { SEED_WARDS, SEED_INCIDENTS } from "@/lib/seed-data";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = "",
  glowColor = "rgba(0, 242, 254, 0.15)",
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`spotlight-card rounded-2xl p-6 relative overflow-hidden backdrop-blur-md transition-all duration-300 ${className}`}
    >
      {/* Dynamic Cursor Spotlight Light */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}, transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full flex flex-col justify-between">{children}</div>
    </div>
  );
};

export const BentoGrid: React.FC = () => {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PROTO-X ARCHITECTURE</span>
          </div>
          <h2 className="font-syne text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Intelligent Infrastructure Telemetry
          </h2>
          <p className="text-slate-400 mt-4 text-base">
            Real-time geospatial intelligence, automated confidence scoring, and cryptographic audit records across Kozhikode Corporation.
          </p>
        </div>

        {/* Asymmetric Bento Grid (Ratios: 2x2, 1x1, 2x1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 auto-rows-[220px]">
          {/* Card 1: Live AI Processing Feed & Confidence Flooring (2x2 Span) */}
          <SpotlightCard className="md:col-span-2 md:row-span-2 border-cyan-500/20 bg-[#090d1a]/80">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-syne font-bold text-lg text-white">
                      AI Ingestion &amp; Confidence Flooring
                    </h3>
                    <p className="text-xs text-slate-400">Gemini CV Inference Engine</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
                  ACTIVE • 142ms
                </span>
              </div>

              {/* Live Detection Visual */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 mb-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
                  <span>Confidence Floor Threshold</span>
                  <span className="text-cyan-400 font-bold">&gt; 0.40 Validated</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 bg-red-500/50 w-[40%]" title="Auto-Reject Zone (< 0.40)" />
                  <div className="absolute left-[40%] top-0 bottom-0 bg-gradient-to-r from-emerald-500 to-cyan-400 w-[60%]" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span className="text-rose-400">0.0 (Reject)</span>
                  <span className="text-amber-400">0.40 Threshold</span>
                  <span className="text-emerald-400">1.0 (Optimal)</span>
                </div>
              </div>

              {/* Real-time Ingestion Stream */}
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-medium text-slate-200">Mavoor Rd Pothole</span>
                    <span className="text-[10px] font-mono text-slate-500">CIV-2204</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-semibold">98.0% Score</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="font-medium text-slate-200">South Beach Waste</span>
                    <span className="text-[10px] font-mono text-slate-500">CIV-1401</span>
                  </div>
                  <span className="font-mono text-cyan-400 font-semibold">94.0% Score</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Automatic Privacy Blurring Enabled
              </span>
              <span className="font-mono text-slate-300 font-semibold">0.0% PII Leaked</span>
            </div>
          </SpotlightCard>

          {/* Card 2: PostGIS Sub-50m Spatial Deduplication (1x1 Span) */}
          <SpotlightCard className="border-indigo-500/20 bg-[#0c1022]/80" glowColor="rgba(99, 102, 241, 0.2)">
            <div>
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mb-3">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-syne font-bold text-white text-base">PostGIS Spatial Deduplication</h3>
              <p className="text-xs text-slate-400 mt-1">
                ST_DWithin 50m proximity indexing against 72h window.
              </p>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-syne font-extrabold text-indigo-300">50m</div>
              <div className="text-xs font-mono text-indigo-400 mt-0.5">Sub-50m Radius Guard</div>
            </div>
          </SpotlightCard>

          {/* Card 3: Nordax Live Protocol Health (1x1 Span) */}
          <SpotlightCard className="border-emerald-500/20 bg-[#091515]/80" glowColor="rgba(16, 185, 129, 0.2)">
            <div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-syne font-bold text-white text-base">Municipal Health Score</h3>
              <p className="text-xs text-slate-400 mt-1">
                Weighted Kozhikode SLA compliance.
              </p>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-syne font-extrabold text-emerald-400">96.8 / 100</div>
              <div className="text-xs font-mono text-emerald-400 mt-0.5">● Grade A+ Dispatch</div>
            </div>
          </SpotlightCard>

          {/* Card 4: WebP Client Compression (2x1 Span) */}
          <SpotlightCard className="md:col-span-2 border-purple-500/20 bg-[#120e24]/80" glowColor="rgba(139, 92, 246, 0.2)">
            <div className="flex items-center justify-between">
              <div>
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit mb-3">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-syne font-bold text-white text-base">
                  Client-Side WebP Compression Pipeline
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sub-1MB client reduction with zero loss of defect acuity.
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-syne font-extrabold text-purple-300">88.5%</div>
                <div className="text-xs font-mono text-purple-400">Bandwidth Saved</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="px-2 py-1 rounded bg-black/40 border border-white/5">Original: ~3.4 MB</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">WebP: ~340 KB</span>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
};
