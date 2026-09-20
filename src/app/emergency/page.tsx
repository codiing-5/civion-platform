"use client";

import React from "react";
import Link from "next/link";
import {
  PhoneCall,
  Shield,
  HeartPulse,
  Flame,
  UserCheck,
  Zap,
  Building,
  ArrowLeft,
} from "lucide-react";

interface EmergencyContact {
  title: string;
  number: string;
  desc: string;
  icon: string;
  badge: string;
  theme: "red" | "blue" | "amber" | "emerald" | "purple";
}

const CONTACTS: EmergencyContact[] = [
  {
    title: "National Emergency / Police",
    number: "112",
    desc: "Immediate police assistance and unified 24/7 disaster response.",
    icon: "🚓",
    badge: "24/7 Unified",
    theme: "blue",
  },
  {
    title: "Ambulance / Medical Emergency",
    number: "108",
    desc: "Free 24-hour emergency medical response and hospital transit.",
    icon: "🚑",
    badge: "24/7 Medical",
    theme: "red",
  },
  {
    title: "Fire & Rescue Service",
    number: "101",
    desc: "Fire breakouts, chemical hazards, building collapse and rescues.",
    icon: "🔥",
    badge: "24/7 Rescue",
    theme: "red",
  },
  {
    title: "Women & Domestic Safety Helpline",
    number: "1091",
    desc: "Toll-free emergency protection, counseling, and legal assistance.",
    icon: "🛡️",
    badge: "Toll Free",
    theme: "purple",
  },
  {
    title: "Childline Emergency Support",
    number: "1098",
    desc: "Emergency care, protection, and rescue for children in distress.",
    icon: "👶",
    badge: "24/7 Child Care",
    theme: "amber",
  },
  {
    title: "Municipal Disaster Control Room",
    number: "1077",
    desc: "Monsoon flooding, tree fall, culvert breach, and civic disaster line.",
    icon: "🌊",
    badge: "Disaster Desk",
    theme: "emerald",
  },
  {
    title: "Electricity Emergency (KSEB)",
    number: "1912",
    desc: "Snapped power lines, transformer bursts, and hazardous electric poles.",
    icon: "💡",
    badge: "Electrical",
    theme: "amber",
  },
];

export default function EmergencyPage() {
  return (
    <div className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <span>Emergency Helplines</span>
          <span className="text-3xl">📞</span>
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          Direct tap-to-call emergency services for life-threatening or urgent situations.
        </p>
      </div>

      {/* Grid of Emergency Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {CONTACTS.map((contact) => (
          <div
            key={contact.number}
            className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{contact.icon}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {contact.badge}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                {contact.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {contact.desc}
              </p>
            </div>

            <a
              href={`tel:${contact.number}`}
              className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-md shadow-red-500/20 active:scale-[0.98] transition-all"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Call {contact.number}</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
