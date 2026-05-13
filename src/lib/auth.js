import { supabase, withTimeout } from "./db.js";

// ── Connexion / déconnexion ────────────────────────────────────────────────────

export async function signIn(email, password) {
  if (!supabase) {
    return { user: null, error: "Supabase non configuré. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local" };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
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
  charge_com:   ["create_article", "edit_article", "publish_article", "manage_events", "manage_media"],
  animateur_rp: ["create_article", "edit_article", "manage_events", "create_form", "view_responses"],
  moderateur:   ["edit_article", "manage_tickets", "view_responses"],
  redacteur:    ["create_article", "manage_drafts"],
  lecteur:      [],
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
