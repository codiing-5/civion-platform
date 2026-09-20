import React from "react";
import Link from "next/link";
import { Building2, Phone, ShieldCheck, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-100 dark:bg-[#070C16] border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">
                Civion
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Report local problems, track resolutions, and help build cleaner, safer, and healthier communities.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              Citizen Services
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/report" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Report a Problem
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Live Community Map
                </Link>
              </li>
              <li>
                <Link href="/reports" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Track My Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency Helplines */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-red-500" />
              Emergency Numbers
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="tel:112" className="hover:text-red-500 transition-colors font-medium">
                  Police / Emergency: <strong className="text-slate-900 dark:text-white">112</strong>
                </a>
              </li>
              <li>
                <a href="tel:108" className="hover:text-red-500 transition-colors font-medium">
                  Ambulance: <strong className="text-slate-900 dark:text-white">108</strong>
                </a>
              </li>
              <li>
                <a href="tel:101" className="hover:text-red-500 transition-colors font-medium">
                  Fire & Rescue: <strong className="text-slate-900 dark:text-white">101</strong>
                </a>
              </li>
              <li>
                <Link href="/emergency" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline block pt-1">
                  View all helplines →
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Trust */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Citizen Privacy
            </h4>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Your email and personal details are strictly protected and never displayed on public community maps.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Civion Platform. Municipal Public Service.</p>
          <p className="flex items-center gap-1">
            Built for citizens <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
