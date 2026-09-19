"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Eye, 
  Zap, 
  Building2,
  CheckCircle,
  Database
} from "lucide-react";

interface HeroSectionProps {
  onOpenReportModal: () => void;
  onExploreMap: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenReportModal,
  onExploreMap,
}) => {
  return (
    <section id="hero" className="relative pt-32 pb-20 overflow-hidden">
      {/* ProtoX Ambient Lighting Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-cyan-500/15 via-indigo-500/15 to-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Nordax Monospaced Telemetry Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-cyan-500/30 backdrop-blur-md mb-8 shadow-lg shadow-cyan-500/5 hover:border-cyan-400/50 transition-colors"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="font-mono text-xs text-cyan-300 font-semibold tracking-wider uppercase">
            Civion Grid Online • Kozhikode Corporation
          </span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-xs text-slate-300">
            PostGIS &lt;50m Active
          </span>
        </motion.div>

        {/* Odyssey Display Typography Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-syne text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.08]"
        >
          <span className="block text-white">AI-Powered Municipal</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">
            Issue Dispatch & Ward Intelligence
          </span>
        </motion.h1>

        {/* Tagline & Attribution */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed"
        >
          <strong className="text-white font-semibold">&ldquo;Real People. Real Photos. Healthier Cities.&rdquo;</strong>
          <br />
          <span className="text-slate-400 text-base">
            Engineered by <strong className="text-cyan-300 font-semibold">Rojan Jose</strong>. Combining client-side WebP compression, AI privacy redacting, sub-50m spatial deduplication, and automated SLA escalation.
          </span>
        </motion.p>

        {/* Action CTA Group */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={onOpenReportModal}
            className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span>Launch Civic Portal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onExploreMap}
            className="px-8 py-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-sm backdrop-blur-md hover:border-cyan-500/30 transition-all flex items-center gap-2"
          >
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Explore Kozhikode Map</span>
          </button>
        </motion.div>

        {/* Live Metrics Trust Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
            <div className="text-2xl font-syne font-bold text-cyan-400">75 Wards</div>
            <div className="text-xs text-slate-400 mt-1">Calicut Municipal Scope</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
            <div className="text-2xl font-syne font-bold text-indigo-400">&lt; 50m</div>
            <div className="text-xs text-slate-400 mt-1">Spatial PostGIS Radius</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
            <div className="text-2xl font-syne font-bold text-emerald-400">96.8%</div>
            <div className="text-xs text-slate-400 mt-1">SLA Resolution Rate</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
            <div className="text-2xl font-syne font-bold text-purple-400">&lt; 140ms</div>
            <div className="text-xs text-slate-400 mt-1">AI Pipeline Latency</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
