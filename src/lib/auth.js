import { supabase, withTimeout } from "./db.js";
import { getProfiles } from "./profiles.js";
import { DEFAULT_ROLE, hasRolePermission, isAdminRole, normalizeRole } from "./communityRoles.js";

// ── Session locale (table members) ────────────────────────────────────────────

const SESSION_KEY = "woltar_member_session";
const TECHNICAL_EMAIL_DOMAIN = import.meta.env.VITE_AUTH_EMAIL_DOMAIN?.trim() || "woltar.net";

export function getMemberSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null; }
  catch { return null; }
}

function setMemberSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearMemberSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Connexion directe via la table members ─────────────────────────────────────

function normalizeUsername(username) {
  return (username || "").trim();
}

function profileToSession(profile, authUser, fallbackUsername) {
  const username = profile?.username || profile?.display_name || fallbackUsername;
  return {
    id:       profile?.id || authUser.id,
    authId:   authUser.id,
    pseudo:   username,
    username,
    role:     normalizeRole(profile?.role),
    authType: "supabase",
  };
}

export async function getProfileByUsername(username) {
  if (!username) return null;
  const clean = normalizeUsername(username);
  if (supabase) {
    try {
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("*").eq("username", clean).maybeSingle()
      );
      if (!error && data) return data;
    } catch {
      // Fall back to the local profiles cache below.
    }
  }
  return getProfiles().find((p) => p.username?.trim().toLowerCase() === clean.toLowerCase()) || null;
}

export async function signInFromMembers(username, password) {
  if (!supabase) {
    return { user: null, error: "Supabase non configuré. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local" };
  }

  const pseudo = normalizeUsername(username);

  let authData;
  let lastError;
  for (const email of getSignInEmails(pseudo)) {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        })
      );
      if (error) throw error;
      authData = data;
      break;
    } catch (e) {
      lastError = e;
    }
  }

  if (!authData) {
    console.log("[Auth] Erreur connexion Supabase:", lastError?.message);
    return { user: null, error: "Pseudo ou mot de passe incorrect." };
  }

  const authUser = authData?.user;
  if (!authUser) {
    return { user: null, error: "Pseudo ou mot de passe incorrect." };
  }

  const profileByUsername = await getProfileByUsername(pseudo);
  const profileByAuthId = profileByUsername ? null : await getUserProfile(authUser.id);
  const session = profileToSession(profileByUsername || profileByAuthId, authUser, pseudo);

  setMemberSession(session);
  window.dispatchEvent(new Event("woltar:auth"));

  console.log("[Auth] Connexion réussie:", session.pseudo, "— rôle:", session.role);
  return { user: session, error: null };
}

// ── Déconnexion ────────────────────────────────────────────────────────────────

export async function signOut() {
  clearMemberSession();
  window.dispatchEvent(new Event("woltar:auth"));
  if (supabase) await supabase.auth.signOut();
}

// ── Supabase Auth (inscription, connexion via Auth) ────────────────────────────

function pseudoToEmailLocalPart(pseudo) {
  const safePseudo = normalizeUsername(pseudo)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return safePseudo || "user";
}

function pseudoToEmail(pseudo) {
  return `${pseudoToEmailLocalPart(pseudo)}@${TECHNICAL_EMAIL_DOMAIN}`;
}

function pseudoToLegacyEmail(pseudo) {
  return `${pseudoToEmailLocalPart(pseudo)}@woltar.nexus`;
}

function pseudoToOldLegacyEmail(pseudo) {
  return `${normalizeUsername(pseudo).toLowerCase().replace(/[^a-z0-9._-]/g, "_")}@woltar.nexus`;
}

function getSignInEmails(pseudo) {
  return [...new Set([pseudoToEmail(pseudo), pseudoToLegacyEmail(pseudo), pseudoToOldLegacyEmail(pseudo)])];
}

export async function registerWithUsername(username, password) {
  if (!supabase) {
    return { user: null, error: "Supabase non configuré. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local" };
  }
  const clean = normalizeUsername(username);
  const email = pseudoToEmail(clean);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username: clean, display_name: clean } },
  });
  if (error) {
    const message = /email rate limit/i.test(error.message)
      ? "Inscription temporairement bloquée par Supabase Auth. Désactivez la confirmation email dans Supabase Auth pour les emails techniques."
      : error.message;
    return { user: null, error: message };
  }
  return { user: data.user, error: null };
}

// ── Profil utilisateur ─────────────────────────────────────────────────────────

export async function getUserProfile(userId) {
  if (!userId) return null;
  if (supabase) {
    try {
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single()
      );
      if (!error && data) return data;
    } catch {
      // Fall back to the local profiles cache below.
    }
  }
  return getProfiles().find((p) => p.id === userId || p.authId === userId) || null;
}

// ── Rôles et permissions ───────────────────────────────────────────────────────

export function hasPermission(profile, permission) {
  if (!profile) return false;
  return hasRolePermission(profile.role || DEFAULT_ROLE, permission);
}

export function isAdmin(profile) {
  return isAdminRole(profile?.role);
}

// ── Écoute des changements d'état auth ────────────────────────────────────────

export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}
