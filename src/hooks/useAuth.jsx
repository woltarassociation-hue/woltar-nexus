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
import { DEFAULT_LEVEL, normalizeRole } from "../lib/profileLevels.js";

const AuthContext = createContext(null);

function profileFromMemberSession(ms) {
  return {
    id:       ms.id,
    authId:   ms.authId,
    role:     normalizeRole(ms.role),
    locked:   ms.locked ?? false,
    username: ms.username || ms.pseudo,
    authType: ms.authType,
  };
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
    id:       profile.id,
    authId:   user.id,
    role:     normalizeRole(profile.role || DEFAULT_LEVEL),
    locked:   profile.locked ?? false,
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

  // Suivi du chargement asynchrone du profil Supabase Auth.
  // false si session membre (profil synchrone), false sans Supabase.
  const [profileLoading, setProfileLoading] = useState(() => {
    const ms = getMemberSession();
    if (isSupabaseMemberSession(ms)) return false;
    return !!supabase;
  });

  useEffect(() => {
    // Session locale (table members) — synchrone, prioritaire.
    // profileLoading est déjà false dans ce cas (initialisé dans useState).
    const ms = getMemberSession();
    if (isSupabaseMemberSession(ms)) return;

    // Pas de Supabase — pas de chargement asynchrone.
    if (!supabase) return;

    // Supabase Auth — résolution asynchrone user + profil
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        resolveProfile(u)
          .then(setProfile)
          .catch(() => setProfile(null))
          .finally(() => setProfileLoading(false));
      } else {
        setProfileLoading(false);
      }
    });

    const unsub = onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        setProfileLoading(true);
        resolveProfile(u)
          .then(setProfile)
          .catch(() => setProfile(null))
          .finally(() => setProfileLoading(false));
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
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
        setProfileLoading(false);
      } else {
        setUser(null);
        setProfile(null);
        setProfileLoading(false);
      }
    };
    window.addEventListener("woltar:auth", sync);
    return () => window.removeEventListener("woltar:auth", sync);
  }, []);

  // loading = true tant que user OU profil ne sont pas encore résolus.
  // Couvre la race condition Supabase Auth (user connu mais profil encore en vol).
  const loading = user === undefined || profileLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin:      checkAdmin(profile),
        hasPermission:(p) => checkPerm(profile, p),
        profileLevel: profile?.role ?? DEFAULT_LEVEL,
        locked:       profile?.locked ?? false,
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
