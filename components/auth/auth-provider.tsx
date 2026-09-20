"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { authApi } from "@/lib/api/auth";
import type { PublicUser } from "@/lib/auth/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: PublicUser | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  mfaToken: string | null;
  setMfaToken: (token: string | null) => void;
  refreshUser: () => Promise<PublicUser | null>;
  logout: () => Promise<void>;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();

      setUser(response.user);
      setStatus("authenticated");

      return response.user;
    } catch {
      setUser(null);
      setStatus("unauthenticated");

      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setMfaToken(null);
      setStatus("unauthenticated");
    }
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setMfaToken(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isLoading: status === "loading",
      isAuthenticated: status === "authenticated",
      mfaToken,
      setMfaToken,
      refreshUser,
      logout,
      clearSession,
    }),
    [user, status, mfaToken, refreshUser, logout, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
