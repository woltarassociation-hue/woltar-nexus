/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../lib/db.js";
import {
  getProfileByUsername,
  getUserProfile,
  onAuthStateChange,
  isAdmin as checkAdmin,
  hasPermission as checkPerm,
  getMemberSession,
} from "../lib/auth.js";
import { DEFAULT_ROLE, normalizeRole } from "../lib/communityRoles.js";

const AuthContext = createContext(null);

function profileFromMemberSession(ms) {
  return { id: ms.id, authId: ms.authId, role: normalizeRole(ms.role), username: ms.username || ms.pseudo, authType: ms.authType };
}

function userFromMemberSession(ms) {
  return { ...ms, id: ms.authId || ms.id };
}

function isSupabaseMemberSession(ms) {
  return ms?.authType === "supabase" && ms.authId;
}

async function resolveProfile(user) {
  if (!user?.id) return null;
  const username =
    user.user_metadata?.username ||
    user.email?.replace(/@(?:woltar\.nexus|woltar\.net)$/i, "");
  const profileByUsername = username ? await getProfileByUsername(username) : null;
  const profile = profileByUsername || await getUserProfile(user.id);
  if (!profile) return null;
  return {
    id: profile.id,
    authId: user.id,
    role: normalizeRole(profile.role || DEFAULT_ROLE),
    username: profile.username || profile.display_name || username,
    authType: "supabase",
  };
}

export function AuthProvider({ children }) {
  // undefined = chargement en cours, null = non connecté
  const [user, setUser] = useState(() => {
    const ms = getMemberSession();
    return isSupabaseMemberSession(ms) ? userFromMemberSession(ms) : supabase ? undefined : null;
  });
  const [profile, setProfile] = useState(() => {
    const ms = getMemberSession();
    return isSupabaseMemberSession(ms) ? profileFromMemberSession(ms) : null;
  });

  useEffect(() => {
    // 1. Session locale (table members) — synchrone, prioritaire
    const ms = getMemberSession();
    if (isSupabaseMemberSession(ms)) {
      return; // pas besoin d'écouter Supabase Auth
    }

    // 2. Supabase Auth
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) resolveProfile(u).then(setProfile);
      else setUser(null);
    });

    const unsub = onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) resolveProfile(u).then(setProfile);
      else setProfile(null);
    });

    return unsub;
  }, []);

  // Écoute des login/logout manuels (members table)
  useEffect(() => {
    const sync = () => {
      const ms = getMemberSession();
      if (isSupabaseMemberSession(ms)) {
        setUser(userFromMemberSession(ms));
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
