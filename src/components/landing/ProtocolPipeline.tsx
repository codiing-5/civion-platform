"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Camera, 
  EyeOff, 
  Cpu, 
  Compass, 
  Send, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Layers,
  Sparkles
} from "lucide-react";

export const ProtocolPipeline: React.FC = () => {
  const steps = [
    {
      step: "01",
      title: "Capture & Compress",
      badge: "CLIENT-SIDE WebP",
      description: "Edge compression algorithm standardizes high-resolution citizen captures into optimal WebP payloads under 1MB.",
      icon: Camera,
      color: "from-cyan-500 to-blue-500",
      accent: "text-cyan-400",
      border: "border-cyan-500/30",
    },
    {
      step: "02",
      title: "AI Privacy Scrubbing",
      badge: "GDPR / DPDP SAFE",
      description: "Heuristic and CV detectors automatically mask human faces and automotive license plates with localized gaussian blurs before database persistence.",
      icon: EyeOff,
      color: "from-indigo-500 to-purple-500",
      accent: "text-indigo-400",
      border: "border-indigo-500/30",
    },
    {
      step: "03",
      title: "Gemini / CV Scoring",
      badge: "CONFIDENCE >= 0.40",
      description: "Municipal computer vision evaluates defect authenticity, categorizes issue severity, and auto-rejects spam below the 0.40 confidence floor.",
      icon: Cpu,
      color: "from-purple-500 to-pink-500",
      accent: "text-purple-400",
      border: "border-purple-500/30",
    },
    {
      step: "04",
      title: "PostGIS Deduplication",
      badge: "ST_DWithin < 50m",
      description: "Sub-50 meter geospatial queries inspect active reports submitted within 72 hours, merging twin reports to eliminate redundant ticketing.",
      icon: Compass,
      color: "from-amber-500 to-orange-500",
      accent: "text-amber-400",
      border: "border-amber-500/30",
    },
    {
      step: "05",
      title: "Ward Routing & SLA",
      badge: "AUTO ESCALATION",
      description: "Instant dispatch to the calibrated Kozhikode Ward Officer (e.g. Ward 14) with countdown timer and automated hourly cron escalation.",
      icon: Send,
      color: "from-emerald-500 to-teal-500",
      accent: "text-emerald-400",
      border: "border-emerald-500/30",
    },
  ];

  return (
    <section id="pipeline" className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>INGESTION PROTOCOL</span>
          </div>
          <h2 className="font-syne text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            The 5-Stage Ingestion Pipeline
          </h2>
          <p className="text-slate-400 mt-4 text-base">
            How an unverified mobile photo is transformed into a sanitized, deduplicated, and SLA-tracked municipal dispatch ticket.
          </p>
        </div>

        {/* 5-Step Grid with Glowing Connectors */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                className="relative group"
              >
                {/* Connecting glowing line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-[2px] bg-gradient-to-r from-white/20 to-transparent z-20 pointer-events-none" />
                )}

                <div className={`h-full rounded-2xl p-5 bg-[#090d19]/90 border ${item.border} backdrop-blur-md hover:border-white/30 transition-all duration-300 hover:shadow-xl flex flex-col justify-between`}>
                  <div>
                    {/* Top Step & Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                        STEP {item.step}
                      </span>
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider mb-1">
                      {item.badge}
                    </div>

                    <h3 className="font-syne font-bold text-base text-white mb-2">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Autonomous Trigger</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
