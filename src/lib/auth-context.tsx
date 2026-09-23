"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User, Role } from "./types";
import { useRouter, usePathname } from "next/navigation";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  phone?: string;
  organization?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  wardId?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isCitizen: boolean;
  isAuthority: boolean;
  isAdmin: boolean;
  isPendingApproval: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
    portalUrl?: string;
    code?: string;
    email?: string;
  }>;
  register: (payload: RegisterPayload) => Promise<{
    success: boolean;
    error?: string;
    cooldownSeconds?: number;
    devOtp?: string;
    email?: string;
    role?: Role;
  }>;
  verifyEmail: (
    email: string,
    otp: string,
    fullName?: string
  ) => Promise<{
    success: boolean;
    error?: string;
    portalUrl?: string;
    isPendingAuthority?: boolean;
  }>;
  sendVerificationOtp: (email: string) => Promise<{
    success: boolean;
    cooldownSeconds?: number;
    devOtp?: string;
    error?: string;
  }>;
  forgotPassword: (email: string) => Promise<{
    success: boolean;
    cooldownSeconds?: number;
    devOtp?: string;
    error?: string;
  }>;
  resetPassword: (
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  refreshUser: () => Promise<void>;
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

  const isCitizen = user?.role === "CITIZEN";
  const isAuthority = user?.role === "OFFICER";
  const isAdmin = user?.role === "ADMIN";
  const isPendingApproval = isAuthority && user?.authorityStatus === "PENDING";

  // Refresh user state from server
  const refreshUser = useCallback(async () => {
    const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null);
    if (!currentToken) return;

    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        }
      }
    } catch {
      // Session check error ignored
    }
  }, [token]);

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

    const citizenProtectedRoutes = ["/dashboard", "/report", "/map", "/reports", "/emergency", "/profile"];
    const authorityRoutes = ["/authority"];
    const adminRoutes = ["/admin"];
    const authRoutes = ["/login", "/register", "/forgot-password", "/auth"];

    const isCitizenProtected = citizenProtectedRoutes.some(
      (route) => pathname === route || pathname?.startsWith(route + "/")
    );
    const isAuthorityRoute = authorityRoutes.some(
      (route) => pathname === route || pathname?.startsWith(route + "/")
    );
    const isAdminRoute = adminRoutes.some(
      (route) => pathname === route || pathname?.startsWith(route + "/")
    );
    const isAuthRoute = authRoutes.some(
      (route) => pathname === route || pathname?.startsWith(route + "/")
    );

    // Unauthenticated user attempting protected area
    if (!user && (isCitizenProtected || isAuthorityRoute || isAdminRoute || pathname === "/pending-approval")) {
      router.replace("/login");
      return;
    }

    // Role-based protection when logged in
    if (user) {
      // Pending authority check
      if (isPendingApproval && pathname !== "/pending-approval" && pathname !== "/profile") {
        router.replace("/pending-approval");
        return;
      }

      // Admin route check
      if (isAdminRoute && !isAdmin) {
        router.replace(isAuthority ? "/authority" : "/dashboard");
        return;
      }

      // Authority route check
      if (isAuthorityRoute && !isAuthority && !isAdmin) {
        router.replace("/dashboard");
        return;
      }

      // If logged in and browsing login/register pages
      if (isAuthRoute) {
        if (isAdmin) router.replace("/admin");
        else if (isAuthority) router.replace(isPendingApproval ? "/pending-approval" : "/authority");
        else router.replace("/dashboard");
      }
    }
  }, [user, isLoading, pathname, router, isAdmin, isAuthority, isPendingApproval]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Email or password is incorrect.",
          code: data.code,
          email: data.email,
        };
      }

      setUser(data.user);
      setToken(data.token);

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);

      return {
        success: true,
        portalUrl: data.portalUrl || "/dashboard",
      };
    } catch {
      return {
        success: false,
        error: "Network error. Please check your internet connection.",
      };
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Failed to register. Please try again.",
        };
      }

      return {
        success: true,
        cooldownSeconds: data.cooldownSeconds || 60,
        devOtp: data.devOtp,
        email: data.email,
        role: data.role,
      };
    } catch {
      return {
        success: false,
        error: "Network error during registration.",
      };
    }
  };

  const sendVerificationOtp = async (email: string) => {
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
          error: data.error || "Unable to send verification code.",
        };
      }

      return {
        success: true,
        cooldownSeconds: data.cooldownSeconds || 60,
        devOtp: data.devOtp,
      };
    } catch {
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  };

  const verifyEmail = async (email: string, otp: string, fullName?: string) => {
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

      return {
        success: true,
        portalUrl: data.portalUrl || "/dashboard",
        isPendingAuthority: data.isPendingAuthority,
      };
    } catch {
      return {
        success: false,
        error: "Network error during verification. Please try again.",
      };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Unable to send password reset code.",
        };
      }

      return {
        success: true,
        cooldownSeconds: data.cooldownSeconds || 60,
        devOtp: data.devOtp,
      };
    } catch {
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  };

  const resetPassword = async (
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Failed to reset password.",
        };
      }

      return { success: true };
    } catch {
      return {
        success: false,
        error: "Network error during password reset.",
      };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    if (!token) return { success: false, error: "Please log in first." };

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Failed to change password.",
        };
      }

      return { success: true };
    } catch {
      return {
        success: false,
        error: "Network error while changing password.",
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    document.cookie = "civion_token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isCitizen,
        isAuthority,
        isAdmin,
        isPendingApproval,
        login,
        register,
        verifyEmail,
        sendVerificationOtp,
        forgotPassword,
        resetPassword,
        changePassword,
        refreshUser,
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

