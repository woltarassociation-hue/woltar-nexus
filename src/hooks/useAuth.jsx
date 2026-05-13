import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../lib/db.js";
import {
  getUserProfile,
  onAuthStateChange,
  isAdmin as checkAdmin,
  hasPermission as checkPerm,
} from "../lib/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = chargement en cours, null = non connecté
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      return;
    }

    // Session courante au montage
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) getUserProfile(u.id).then(setProfile);
    });

    // Écoute des changements (login / logout / refresh token)
    const unsub = onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) getUserProfile(u.id).then(setProfile);
      else setProfile(null);
    });

    return unsub;
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
