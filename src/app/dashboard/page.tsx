"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  AlertTriangle,
  MapPin,
  ClipboardList,
  PhoneCall,
  ArrowRight,
  Sparkles,
  PlusCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const actionCards = [
    {
      href: "/report",
      icon: "🚨",
      title: "Report a local problem",
      description: "Tell us about something that needs attention.",
      badge: "Quick Report",
      badgeColor: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
      accentBg: "bg-red-500/10 dark:bg-red-500/10",
      borderHover: "hover:border-red-500/50 hover:shadow-red-500/10",
    },
    {
      href: "/map",
      icon: "🗺️",
      title: "View Live Map",
      description: "See reported problems around you.",
      badge: "Community",
      badgeColor: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
      accentBg: "bg-blue-500/10 dark:bg-blue-500/10",
      borderHover: "hover:border-blue-500/50 hover:shadow-blue-500/10",
    },
    {
      href: "/reports",
      icon: "📋",
      title: "My Submitted Reports",
      description: "Track the problems you reported.",
      badge: "Track Status",
      badgeColor: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
      accentBg: "bg-emerald-500/10 dark:bg-emerald-500/10",
      borderHover: "hover:border-emerald-500/50 hover:shadow-emerald-500/10",
    },
    {
      href: "/emergency",
      icon: "📞",
      title: "Emergency Helplines",
      description: "Find important emergency numbers.",
      badge: "24/7 Lines",
      badgeColor: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
      accentBg: "bg-amber-500/10 dark:bg-amber-500/10",
      borderHover: "hover:border-amber-500/50 hover:shadow-amber-500/10",
    },
  ];

  return (
    <div className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Welcome citizen header */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Welcome back, {user?.name || "Citizen"}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          What would you like to do?
        </h1>
        <p className="mt-2 text-base sm:text-lg text-slate-600 dark:text-slate-400">
          Choose an option below.
        </p>
      </div>

      {/* Grid of Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {actionCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`group relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${card.borderHover} flex flex-col justify-between min-h-[220px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${card.badgeColor}`}
                >
                  {card.badge}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {card.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                {card.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              <span>Open</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Primary Floating Button for Mobile */}
      <div className="mt-10 sm:hidden">
        <Link
          href="/report"
          className="w-full min-h-[52px] px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold text-base shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Report a Problem Now</span>
        </Link>
      </div>
    </div>
  );
}
