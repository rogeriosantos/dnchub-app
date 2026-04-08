"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService, tokenStorage } from "@/lib/api";
import type { RegisterRequest } from "@/lib/api/auth";
import type { User } from "@/types";
import { changeLanguage } from "@/lib/i18n";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/fleet/pos"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = !!user;

  // Check if current path is public (handle null pathname)
  const isPublicRoute = pathname
    ? PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
    : true; // Assume public while pathname is loading

  // Check for existing session on mount (skip for public routes)
  React.useEffect(() => {
    // Wait for pathname to be available
    if (!pathname) return;

    const checkAuth = async () => {
      // Skip auth check for public routes
      if (isPublicRoute) {
        setIsLoading(false);
        return;
      }

      if (tokenStorage.isAuthenticated()) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          changeLanguage(currentUser.language);
        } catch (error) {
          // Token is invalid or expired
          console.error("Auth check failed:", error);
          tokenStorage.clearTokens();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, isPublicRoute]);

  // Redirect to login if not authenticated and on protected route
  React.useEffect(() => {
    // Don't redirect while pathname is loading or on public routes
    if (!pathname || isPublicRoute) return;

    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!isLoading && isAuthenticated && pathname === "/login") {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, isPublicRoute, pathname, router]);

  const login = React.useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    changeLanguage(result.user.language);
    router.push("/dashboard");
  }, [router]);

  const register = React.useCallback(async (data: RegisterRequest) => {
    const result = await authService.register(data);
    setUser(result.user);
    changeLanguage(result.user.language);
    router.push("/dashboard");
  }, [router]);

  const logout = React.useCallback(() => {
    authService.logout();
    setUser(null);
    router.push("/login");
  }, [router]);

  const refreshUser = React.useCallback(async () => {
    if (tokenStorage.isAuthenticated()) {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        changeLanguage(currentUser.language);
      } catch (error) {
        console.error("Failed to refresh user:", error);
        logout();
      }
    }
  }, [logout]);

  const value = React.useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, isAuthenticated, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
