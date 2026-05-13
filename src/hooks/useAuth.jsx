import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../lib/db.js";
import {
  getUserProfile,
  onAuthStateChange,
  isAdmin as checkAdmin,
  hasPermission as checkPerm,
  getMemberSession,
} from "../lib/auth.js";

const AuthContext = createContext(null);

function profileFromMemberSession(ms) {
  return { id: ms.id, role: ms.role, username: ms.pseudo, authType: "members" };
}

export function AuthProvider({ children }) {
  // undefined = chargement en cours, null = non connecté
  const [user, setUser]       = useState(undefined);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // 1. Session locale (table members) — synchrone, prioritaire
    const ms = getMemberSession();
    if (ms) {
      setUser(ms);
      setProfile(profileFromMemberSession(ms));
      return; // pas besoin d'écouter Supabase Auth
    }

    // 2. Supabase Auth
    if (!supabase) {
      setUser(null);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) getUserProfile(u.id).then(setProfile);
      else setUser(null);
    });

    const unsub = onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) getUserProfile(u.id).then(setProfile);
      else setProfile(null);
    });

    return unsub;
  }, []);

  // Écoute des login/logout manuels (members table)
  useEffect(() => {
    const sync = () => {
      const ms = getMemberSession();
      if (ms) {
        setUser(ms);
        setProfile(profileFromMemberSession(ms));
      } else {
        setUser(null);
        setProfile(null);
      }
    };
    window.addEventListener("woltar:auth", sync);
    return () => window.removeEventListener("woltar:auth", sync);
  }, []);

  const loading = user === undefined;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: checkAdmin(profile),
        hasPermission: (p) => checkPerm(profile, p),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
