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
import { doc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  createUser,
  signIn,
  signOut,
  subscribeToAuth,
  type SessionUser,
} from "@/lib/auth";
import { type Role } from "@/lib/mockData";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (email: string, password: string, requestedRole?: string) => Promise<void>;
  logout: () => Promise<void>;
  canAccess: (area: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const hiddenByRole: Record<string, string[]> = {
  viewer: ["audit", "users", "settings"],
  developer: ["scaling", "policies", "cost", "audit", "users", "settings"],
  operator: ["users", "settings"],
  admin: [],
  super_admin: [],
  pending: ["dashboard", "monitoring", "scaling", "policies", "predictive", "alerts", "providers", "resources", "cost", "audit", "users", "settings"],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    const unsubscribe = subscribeToAuth((firebaseUser) => {
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        window.localStorage.setItem("asrms-session", JSON.stringify(firebaseUser));

        if (isFirebaseConfigured && db) {
          unsubFirestore = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const updatedUser = {
                ...firebaseUser,
                role: (data.role || firebaseUser.role) as Role,
                status: data.status || "active",
                displayName: data.displayName || firebaseUser.displayName,
              };
              setUser(updatedUser);
              window.localStorage.setItem("asrms-session", JSON.stringify(updatedUser));
            }
          });
        }
      } else {
        // No authenticated Firebase session -> clear user completely
        setUser(null);
        window.localStorage.removeItem("asrms-session");
      }
      setLoading(false);
    });

    // Safety fallback: ensure loading screen NEVER hangs indefinitely
    const timer = setTimeout(() => setLoading(false), 1500);

    return () => {
      clearTimeout(timer);
      unsubscribe();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") router.replace("/login");
      if (user && pathname === "/login") {
        if (user.role === "pending") {
          // Stay on current page, ShellInner will show approval screen
        } else {
          router.replace("/dashboard");
        }
      }
    }
  }, [pathname, router, user, loading]);

  const persist = useCallback((nextUser: SessionUser) => {
    window.localStorage.setItem("asrms-session", JSON.stringify(nextUser));
    setUser(nextUser);
    if (nextUser.role !== "pending") {
      router.replace("/dashboard");
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (identifier, password) => persist(await signIn(identifier, password)),
      signup: async (email, password, requestedRole) => persist(await createUser(email, password, requestedRole)),
      logout: async () => {
        await signOut();
        window.localStorage.removeItem("asrms-session");
        setUser(null);
        router.replace("/login");
      },
      canAccess: (area) => {
        if (!user) return false;
        return !hiddenByRole[user.role]?.includes(area);
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
