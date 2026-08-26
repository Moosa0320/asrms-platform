"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUser,
  signIn,
  signOut,
  subscribeToAuth,
  type SessionUser,
} from "@/lib/auth";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  canAccess: (area: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const hiddenByRole: Record<string, string[]> = {
  viewer: ["audit", "users", "settings"],
  developer: ["scaling", "policies", "cost", "audit", "users", "settings"],
  operator: ["users", "settings"],
  admin: [],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Try to load initial session from localStorage for faster initial render
    const saved = window.localStorage.getItem("asrms-session");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        window.localStorage.removeItem("asrms-session");
      }
    }
    
    // Then subscribe to real Firebase auth
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      setLoading(false);
      if (firebaseUser) {
        setUser(firebaseUser);
        window.localStorage.setItem("asrms-session", JSON.stringify(firebaseUser));
      } else {
        setUser(null);
        window.localStorage.removeItem("asrms-session");
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") router.replace("/login");
      if (user && pathname === "/login") router.replace("/dashboard");
    }
  }, [pathname, router, user, loading]);

  const persist = useCallback((nextUser: SessionUser) => {
    window.localStorage.setItem("asrms-session", JSON.stringify(nextUser));
    setUser(nextUser);
    router.replace("/dashboard");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (identifier, password) => persist(await signIn(identifier, password)),
      signup: async (email, password) => persist(await createUser(email, password)),
      logout: async () => {
        await signOut();
        window.localStorage.removeItem("asrms-session");
        setUser(null);
        router.replace("/login");
      },
      canAccess: (area) => {
        if (!user) return false;
        return !hiddenByRole[user.role].includes(area);
      },
    }),
    [persist, router, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
