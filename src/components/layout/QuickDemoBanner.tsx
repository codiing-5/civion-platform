"use client";

import React from "react";
import { Role } from "@/lib/types";
import { Shield, UserCheck, ShieldAlert, Cpu, CheckCircle2 } from "lucide-react";

interface QuickDemoBannerProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

export const QuickDemoBanner: React.FC<QuickDemoBannerProps> = ({
  currentRole,
  onRoleChange,
}) => {
  return (
    <div className="w-full bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-cyan-950/90 border-b border-indigo-500/20 backdrop-blur-md px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono font-semibold text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            JUDGING PITCH MODE
          </div>
          <p className="text-slate-300 text-[11px] hidden sm:inline">
            Simulate role-scoped JWT credentials with <strong className="text-cyan-300">Absolute Role Immutability</strong>:
          </p>
        </div>

        {/* Role Selectors */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRoleChange("CITIZEN")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all text-xs ${
              currentRole === "CITIZEN"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/20 font-semibold"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Citizen (Rohan)</span>
            {currentRole === "CITIZEN" && <CheckCircle2 className="w-3 h-3 text-cyan-400 ml-0.5" />}
          </button>

          <button
            onClick={() => onRoleChange("OFFICER")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all text-xs ${
              currentRole === "OFFICER"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/50 shadow-sm shadow-indigo-500/20 font-semibold"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Officer (Ward 14)</span>
            {currentRole === "OFFICER" && <CheckCircle2 className="w-3 h-3 text-indigo-400 ml-0.5" />}
          </button>

          <button
            onClick={() => onRoleChange("ADMIN")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all text-xs ${
              currentRole === "ADMIN"
                ? "bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-sm shadow-purple-500/20 font-semibold"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin (Rojan Jose)</span>
            {currentRole === "ADMIN" && <CheckCircle2 className="w-3 h-3 text-purple-400 ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
