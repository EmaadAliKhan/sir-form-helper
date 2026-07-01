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
import { usePathname, useRouter } from "next/navigation";
import type { AuthSession } from "@/lib/authTypes";
import { preloadCalibration } from "@/lib/clientCalibration";
import {
  clearSession,
  getSession,
  isAdmin,
  login as authLogin,
} from "@/lib/clientAuth";

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  isAdminUser: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizePath(pathname: string): string {
  return pathname.replace(/\/$/, "") || "/";
}

function isLoginPath(pathname: string): boolean {
  return normalizePath(pathname) === "/login";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setSession(getSession());
    preloadCalibration().finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const next = await authLogin(username, password);
    setSession(next);
    router.replace("/");
  }, [router]);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    router.replace("/login/");
  }, [router]);

  const value = useMemo(
    () => ({
      session,
      loading,
      isAdminUser: isAdmin(session),
      login,
      logout,
    }),
    [session, loading, login, logout]
  );

  useEffect(() => {
    if (loading) return;
    if (!session && !isLoginPath(pathname)) {
      router.replace("/login/");
    }
  }, [loading, session, pathname, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  if (!session && !isLoginPath(pathname)) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
