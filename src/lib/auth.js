import { supabase, withTimeout } from "./db.js";
import { getMemberByAuthIdRemote } from "./members.js";

// ── Session locale (table members) ────────────────────────────────────────────

const SESSION_KEY = "woltar_member_session";

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

export async function signInFromMembers(username, password) {
  if (!supabase) {
    return { user: null, error: "Supabase non configuré. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local" };
  }

  const pseudo = username.trim();

  let authData;
  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email: pseudoToEmail(pseudo),
        password,
      })
    );
    if (error) throw error;
    authData = data;
  } catch (e) {
    console.log("[Auth] Erreur connexion Supabase:", e.message);
    return { user: null, error: "Pseudo ou mot de passe incorrect." };
  }

  const authUser = authData?.user;
  if (!authUser) {
    return { user: null, error: "Pseudo ou mot de passe incorrect." };
  }

  const member = await getMemberByAuthIdRemote(authUser.id);
  const profile = member ? null : await getUserProfile(authUser.id);

  const session = {
    id:       member?.id || authUser.id,
    authId:   authUser.id,
    pseudo:   member?.pseudo || profile?.username || profile?.display_name || pseudo,
    role:     member?.role || profile?.role || "membre",
    authType: "supabase",
  };

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

function pseudoToEmail(pseudo) {
  return `${pseudo.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_")}@woltar.nexus`;
}

export async function registerWithUsername(username, password) {
  if (!supabase) {
    return { user: null, error: "Supabase non configuré. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local" };
  }
  const email = pseudoToEmail(username);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username: username.trim(), display_name: username.trim() } },
  });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

// ── Profil utilisateur ─────────────────────────────────────────────────────────

export async function getUserProfile(userId) {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await withTimeout(
      supabase.from("profiles").select("*").eq("id", userId).single()
    );
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// ── Rôles et permissions ───────────────────────────────────────────────────────

const ROLE_PERMISSIONS = {
  super_admin:  ["*"],
  admin:        ["*"],
  charge_com:   [
    "create_article", "edit_article", "publish_article", "manage_events", "manage_media",
    "manage_polls", "vote_poll", "validate_poll", "create_popup", "manage_popups", "view_stats",
  ],
  animateur_rp: [
    "create_article", "edit_article", "manage_events", "create_form", "view_responses",
    "manage_polls", "vote_poll", "view_stats",
  ],
  moderateur:   [
    "edit_article", "manage_tickets", "view_responses",
    "vote_poll", "manage_members", "view_stats",
  ],
  redacteur:    ["create_article", "manage_drafts", "vote_poll"],
  lecteur:      ["vote_poll"],
};

export function hasPermission(profile, permission) {
  if (!profile) return false;
  const allowed = ROLE_PERMISSIONS[profile.role] ?? [];
  return allowed.includes("*") || allowed.includes(permission);
}

export function isAdmin(profile) {
  return profile?.role === "admin" || profile?.role === "super_admin";
}

// ── Écoute des changements d'état auth ────────────────────────────────────────

export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}
