"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "./types";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sendEmailOtp: (email: string) => Promise<{
    success: boolean;
    isExistingUser?: boolean;
    cooldownSeconds?: number;
    error?: string;
  }>;
  verifyEmailOtp: (
    email: string,
    otp: string,
    fullName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "civion_citizen_session";
const TOKEN_STORAGE_KEY = "civion_citizen_token";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth session on client load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (err) {
      console.error("Failed to restore auth session:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Route protection effect
  useEffect(() => {
    if (isLoading) return;

    const protectedRoutes = ["/dashboard", "/report", "/map", "/reports", "/emergency"];
    const authRoutes = ["/login", "/auth"];

    const isProtected = protectedRoutes.some(
      (route) => pathname === route || pathname?.startsWith(route + "/")
    );
    const isAuthRoute = authRoutes.some(
      (route) => pathname === route || pathname?.startsWith(route + "/")
    );

    if (!user && isProtected) {
      router.replace("/login");
    } else if (user && isAuthRoute) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, pathname, router]);

  const sendEmailOtp = async (email: string) => {
    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Unable to send verification code. Please check your email address.",
        };
      }

      return {
        success: true,
        isExistingUser: data.isExistingUser,
        cooldownSeconds: data.cooldownSeconds || 60,
      };
    } catch {
      return {
        success: false,
        error: "Network error. Please check your internet connection and try again.",
      };
    }
  };

  const verifyEmailOtp = async (email: string, otp: string, fullName?: string) => {
    try {
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          fullName: fullName?.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "The verification code is incorrect or expired.",
        };
      }

      setUser(data.user);
      setToken(data.token);

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);

      return { success: true };
    } catch {
      return {
        success: false,
        error: "Network error during verification. Please try again.",
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    document.cookie = "civion_token=; path=/; max-age=0";
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        sendEmailOtp,
        verifyEmailOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
