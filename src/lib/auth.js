import { supabase, withTimeout } from "./db.js";

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
  const pwd    = password.trim();

  console.log("[Auth] Recherche dans members — pseudo:", pseudo);

  let data, queryError;
  try {
    ({ data, error: queryError } = await withTimeout(
      supabase.from("members").select("id, pseudo, password, role").eq("pseudo", pseudo).maybeSingle()
    ));
  } catch (e) {
    console.log("[Auth] Erreur requête:", e.message);
    return { user: null, error: "Erreur de connexion. Réessayez." };
  }

  if (queryError || !data) {
    console.log("[Auth] Aucun utilisateur trouvé pour pseudo =", pseudo, "|", queryError?.message);
    return { user: null, error: "Pseudo ou mot de passe incorrect." };
  }

  console.log("[Auth] Utilisateur trouvé:", data.pseudo, "| rôle:", data.role);

  const storedPwd = (data.password ?? "").trim();
  if (storedPwd !== pwd) {
    console.log("[Auth] Mot de passe incorrect (ne correspond pas à la valeur stockée)");
    return { user: null, error: "Pseudo ou mot de passe incorrect." };
  }

  const session = {
    id:       data.id,
    pseudo:   data.pseudo,
    role:     data.role,
    authType: "members",
  };

  setMemberSession(session);
  window.dispatchEvent(new Event("woltar:auth"));

  console.log("[Auth] Connexion réussie:", data.pseudo, "— rôle:", data.role);
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
