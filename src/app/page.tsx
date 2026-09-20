"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ImageComparisonSlider } from "@/components/incidents/ImageComparisonSlider";
import {
  Camera,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  Clock,
  EyeOff,
  SlidersHorizontal,
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const [activeProofIndex, setActiveProofIndex] = useState(0);

  const proofExamples = [
    {
      title: "Asphalt Pothole Cluster Resurfacing",
      location: "Mavoor Road Junction, Kozhikode",
      ticketNumber: "CIV-2204",
      beforeImageUrl:
        "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80",
      afterImageUrl:
        "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1000&q=80",
      resolutionNotes:
        "Ward Road Squad filled 28cm crater cluster, compacted sub-base, and laid fresh bitumen overlay.",
    },
    {
      title: "Illegal Solid Waste Dumping Clearance",
      location: "South Beach Promenade, Kozhikode",
      ticketNumber: "CIV-1401",
      beforeImageUrl:
        "https://images.unsplash.com/photo-1611288875785-5a50785ffac1?auto=format&fit=crop&w=1000&q=80",
      afterImageUrl:
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80",
      resolutionNotes:
        "Sanitation crew collected 420kg commercial debris, sanitized pavement, and installed public warning sign.",
    },
  ];

  const categories = [
    {
      icon: "🕳️",
      title: "Pothole / Road Defect",
      desc: "Report damaged roads, dangerous craters, or asphalt cracks.",
    },
    {
      icon: "🗑️",
      title: "Waste Dumping / Sanitation",
      desc: "Flag uncollected garbage, overflow bins, or illegal debris.",
    },
    {
      icon: "💡",
      title: "Streetlight / Electrical",
      desc: "Report unlit lamps, hanging cables, or dark street stretches.",
    },
    {
      icon: "🚰",
      title: "Water Pipeline Leak",
      desc: "Report bursting municipal supply lines or public tap leaks.",
    },
    {
      icon: "🌊",
      title: "Drainage / Culvert Clog",
      desc: "Report blocked stormwater drains or stagnant flood water.",
    },
    {
      icon: "✏️",
      title: "Other Municipal Issue",
      desc: "Any other public problem in your local neighbourhood.",
    },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-blue-950/20 dark:via-transparent dark:to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Civic Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Citizen-First Municipal Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-6">
            Report local problems. <br className="hidden sm:inline" />
            <span className="text-blue-600 dark:text-blue-500">
              Help improve your community.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed mb-10">
            Civion makes it easy to report potholes, waste, broken streetlights,
            leaks and other local problems.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base sm:text-lg shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{user ? "Open Dashboard" : "Login / Sign Up"}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto min-h-[52px] px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-base border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors"
            >
              How It Works
            </a>
          </div>

          {/* Quick Trust Highlights */}
          <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No passwords needed</span>
            </div>
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-blue-500" />
              <span>Private & secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Under 60 seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-16 md:py-24 bg-white dark:bg-[#070C16] border-y border-slate-200/80 dark:border-slate-800/80 transition-colors"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
              Three simple steps to report any problem in your neighbourhood.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center text-center group hover:border-blue-500/50 transition-colors">
              <div className="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:scale-110 transition-transform">
                📷
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                Step 1
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Take a photo
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Show the local problem with a quick photo using your phone camera.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center text-center group hover:border-blue-500/50 transition-colors">
              <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:scale-110 transition-transform">
                📍
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                Step 2
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Tell us where
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Use your current location automatically or enter a nearby landmark.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center text-center group hover:border-blue-500/50 transition-colors">
              <div className="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:scale-110 transition-transform">
                ✅
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                Step 3
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Track the fix
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                See what is happening with your report as the work team fixes it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Transformations Before & After Showcase */}
      <section className="py-16 md:py-24 bg-slate-50/50 dark:bg-[#0B1220] transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2 block">
              Citizen Impact
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              Real Problems. Real Fixes.
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
              See how civic reports are resolved on the ground by municipal work teams.
            </p>
          </div>

          {/* Switcher tabs */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {proofExamples.map((proof, idx) => (
              <button
                key={proof.title}
                type="button"
                onClick={() => setActiveProofIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeProofIndex === idx
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                }`}
              >
                {proof.title.split(" ")[0]} Fix
              </button>
            ))}
          </div>

          {/* Interactive Slider */}
          <ImageComparisonSlider
            title={proofExamples[activeProofIndex].title}
            location={proofExamples[activeProofIndex].location}
            ticketNumber={proofExamples[activeProofIndex].ticketNumber}
            beforeImageUrl={proofExamples[activeProofIndex].beforeImageUrl}
            afterImageUrl={proofExamples[activeProofIndex].afterImageUrl}
            resolutionNotes={proofExamples[activeProofIndex].resolutionNotes}
          />
        </div>
      </section>

      {/* Common Problems We Address */}
      <section className="py-16 md:py-24 bg-white dark:bg-[#070C16] border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              What can you report?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
              Civion handles every everyday civic issue that affects your neighbourhood.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <div
                key={cat.title}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4 hover:border-blue-500/40 transition-colors"
              >
                <div className="text-3xl p-2.5 rounded-xl bg-white dark:bg-slate-800/80 shadow-sm shrink-0">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                    {cat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Civion / Citizen Promise */}
      <section className="py-16 bg-blue-600 dark:bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-6">
            Simple for everyone. Transparent for the community.
          </h2>
          <p className="max-w-2xl mx-auto text-blue-100 text-base sm:text-lg mb-10 leading-relaxed">
            No complex paperwork, no bureaucratic queues. An easy tool designed
            for elderly citizens, youth, and busy workers alike.
          </p>

          <Link
            href={user ? "/report" : "/login"}
            className="inline-flex min-h-[52px] px-8 py-3.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-base sm:text-lg shadow-xl transition-all hover:scale-105 active:scale-95 items-center gap-2"
          >
            <span>Report a Problem Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
