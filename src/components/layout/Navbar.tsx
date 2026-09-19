"use client";

import React, { useState, useEffect } from "react";
import { Role } from "@/lib/types";
import { 
  ShieldCheck, 
  Activity, 
  MapPin, 
  FileSpreadsheet, 
  PlusCircle, 
  Sun, 
  Moon, 
  Terminal,
  Sparkles,
  Building2
} from "lucide-react";

interface NavbarProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  onOpenReportModal: () => void;
  onOpenExportModal: () => void;
  onOpenTerminal: () => void;
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  onOpenReportModal,
  onOpenExportModal,
  onOpenTerminal,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#050508]/85 backdrop-blur-md border-b border-white/10 shadow-2xl shadow-black/50 py-3"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <a href="#hero" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <div className="w-full h-full bg-[#070913] rounded-[11px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-syne font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-300">
                  CIVION
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider font-semibold">
                  v1.4 PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                Kozhikode Municipal Dispatch
              </p>
            </div>
          </a>
        </div>

        {/* Nordax Live Telemetry Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-inner">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-emerald-400 font-semibold tracking-wider">
            ● PROTOCOL v1.0 • LIVE
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-mono text-slate-300">
            GRID HEALTH: <strong className="text-cyan-400">99.4%</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-mono text-slate-400">
            DEDUP: <strong className="text-indigo-400">&lt;50m</strong>
          </span>
        </div>

        {/* Navigation Actions & Role Picker */}
        <div className="flex items-center gap-2.5">
          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1 mr-2 text-xs font-medium text-slate-300">
            <a
              href="#map-section"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Live Map
            </a>
            <a
              href="#pipeline"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Pipeline
            </a>
            <button
              onClick={onOpenExportModal}
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Audit Exports
            </button>
          </nav>

          {/* Terminal Console Trigger */}
          <button
            onClick={onOpenTerminal}
            title="Open Developer Event Inspector"
            className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:text-cyan-400 hover:bg-white/10 transition-colors"
          >
            <Terminal className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:text-yellow-400 hover:bg-white/10 transition-colors"
          >
            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Report Incident CTA */}
          <button
            onClick={onOpenReportModal}
            className="relative group overflow-hidden rounded-xl p-[1px] focus:outline-none"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-xl group-hover:opacity-100 transition-opacity"></span>
            <span className="relative flex items-center gap-2 px-4 py-2 bg-[#080b14] rounded-[11px] text-xs font-semibold text-white group-hover:bg-[#0c1020] transition-colors shadow-lg">
              <PlusCircle className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform" />
              Report Issue
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
