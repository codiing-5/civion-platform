"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "./ThemeToggle";
import {
  Building2,
  PlusCircle,
  MapPin,
  FileText,
  PhoneCall,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

interface NavLinkItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  isPrimary?: boolean;
}

export const Navbar: React.FC = () => {
  const { user, logout, isAuthority, isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  // Dynamic Navigation Links tailored per role
  let navLinks: NavLinkItem[] = [];

  if (!user) {
    navLinks = [
      { name: "Home", href: "/" },
      { name: "How It Works", href: "/#how-it-works" },
      { name: "Emergency Helplines", href: "/emergency", icon: PhoneCall },
    ];
  } else if (isAdmin) {
    navLinks = [
      { name: "Admin Console", href: "/admin", icon: ShieldAlert },
      { name: "Authority Queue", href: "/admin", icon: ShieldCheck },
      { name: "Authority Portal", href: "/authority", icon: LayoutDashboard },
      { name: "Live Map", href: "/map", icon: MapPin },
      { name: "Profile", href: "/profile", icon: UserIcon },
    ];
  } else if (isAuthority) {
    navLinks = [
      { name: "Authority Portal", href: "/authority", icon: LayoutDashboard },
      { name: "Live Map", href: "/map", icon: MapPin },
      { name: "Report Problem", href: "/report", icon: PlusCircle, isPrimary: true },
      { name: "Profile", href: "/profile", icon: UserIcon },
    ];
  } else {
    // Citizen
    navLinks = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Report Problem", href: "/report", icon: PlusCircle, isPrimary: true },
      { name: "Live Map", href: "/map", icon: MapPin },
      { name: "My Reports", href: "/reports", icon: FileText },
      { name: "Emergency", href: "/emergency", icon: PhoneCall },
      { name: "Profile", href: "/profile", icon: UserIcon },
    ];
  }

  const defaultHomeUrl = user
    ? isAdmin
      ? "/admin"
      : isAuthority
      ? "/authority"
      : "/dashboard"
    : "/";

  const roleLabel = isAdmin ? "Admin" : isAuthority ? "Officer" : "Citizen";
  const roleBadgeColor = isAdmin
    ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
    : isAuthority
    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
    : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300";

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Brand */}
          <Link
            href={defaultHomeUrl}
            onClick={closeMenu}
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 dark:bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white">
                Civion
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-1 hidden sm:block">
                {isAdmin ? "Admin Governance Platform" : isAuthority ? "Municipal Authority Desk" : "Citizen Reporting Platform"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              if (link.isPrimary) {
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all hover:shadow hover:shadow-blue-500/20 active:scale-[0.98]"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{link.name}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {user ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${roleBadgeColor}`}>
                    {roleLabel}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  title="Log out"
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center"
                  aria-label="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-900 dark:text-white text-sm font-semibold transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all"
                >
                  Create Account
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {user && (
            <div className="p-3 mb-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.email || user.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  closeMenu();
                  logout();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
              >
                Log Out
              </button>
            </div>
          )}

          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            if (link.isPrimary) {
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMenu}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm"
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span>{link.name}</span>
                </Link>
              );
            }

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={closeMenu}
                className={`w-full min-h-[48px] px-4 py-3 rounded-xl text-base font-medium flex items-center gap-3 ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {Icon && <Icon className="w-5 h-5 text-slate-400 dark:text-slate-400" />}
                <span>{link.name}</span>
              </Link>
            );
          })}

          {!user && (
            <div className="pt-2">
              <Link
                href="/login"
                onClick={closeMenu}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm"
              >
                Login / Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
