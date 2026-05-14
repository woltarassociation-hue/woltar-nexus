import { supabase, withTimeout, fromDb } from "./db.js";
import { DEFAULT_ROLE, ROLE_LABELS, normalizeRole } from "./communityRoles.js";

const KEY = "woltar_profiles";
const SESSION_KEY = "woltar_session";

let _cache = null;

export { ROLE_LABELS };

const DEFAULT_PROFILES = [
  { id: "default-admin",  name: "Administrateur", role: "administrateur", username: "association" },
  { id: "default-artiste", name: "Artistes",       role: "artiste",       username: "artiste" },
  { id: "default-comm",   name: "Communication",   role: "communication", username: "communication" },
];

function sanitizeProfile(profile) {
  const safe = { ...profile };
  delete safe.password;
  delete safe.password_hash;
  // _rawRole : valeur DB originale (admin, super_admin…) préservée pour les écritures.
  // Ne pas normaliser tant que la migration SQL n'a pas posé la contrainte.
  if (safe._rawRole === undefined) {
    safe._rawRole = safe.role ?? null;
  } else {
    // Si le rôle a été explicitement changé (formes normalisées différentes), on suit le changement.
    if (normalizeRole(safe._rawRole || DEFAULT_ROLE) !== normalizeRole(safe.role || DEFAULT_ROLE)) {
      safe._rawRole = safe.role ?? null;
    }
  }
  safe.role = normalizeRole(safe.role || DEFAULT_ROLE);
  safe.name = safe.name || safe.displayName || safe.display_name || safe.username || "";
  return safe;
}

function sanitizeProfiles(profiles) {
  return (profiles || []).map(sanitizeProfile);
}

function toRemoteProfile(profile) {
  const safe = sanitizeProfile(profile);
  return {
    id: safe.id,
    username: safe.username,
    name: safe.name || safe.username,
    display_name: safe.displayName || safe.display_name || safe.name || safe.username,
    role: safe._rawRole ?? safe.role,
    avatar_url: safe.avatarUrl || safe.avatar_url || null,
    bio: safe.bio || "",
    woltarien1: safe.woltarien1 || "",
    woltarien2: safe.woltarien2 || null,
    links: safe.links || {},
    updated_at: safe.updatedAt || new Date().toISOString(),
  };
}

function readLocal() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!stored || stored.length === 0) return null;
    const sanitized = sanitizeProfiles(stored);
    localStorage.setItem(KEY, JSON.stringify(sanitized));
    return sanitized;
  } catch { return null; }
}

function dispatch() {
  window.dispatchEvent(new Event("woltar:profiles"));
}

export function getProfiles() {
  if (_cache !== null) return _cache;
  return readLocal() || [];
}

async function loadFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await withTimeout(
      supabase.from("profiles").select("*").order("created_at", { ascending: true })
    );
    if (error) throw error;
    if (data && data.length > 0) {
      _cache = sanitizeProfiles(data.map(fromDb));
      localStorage.setItem(KEY, JSON.stringify(_cache));
      dispatch();
    }
  } catch (err) {
    console.warn("[profiles] Supabase load failed:", err.message);
  }
}

// Auto-init + realtime
if (supabase) {
  loadFromSupabase();
  supabase
    .channel("profiles-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadFromSupabase)
    .subscribe();
}

/* isConfigured : retourne true si au moins un compte non-default existe */
export function isConfigured() {
  return getProfiles().some((p) => !String(p.id).startsWith("default-"));
}

export async function seedDefaultProfiles() {
  const existing = readLocal();
  if (existing && existing.length > 0) {
    // Des profils existent en local — utiliser le cache
    _cache = existing;
    if (supabase) {
      // Synchroniser les profils locaux vers Supabase si la table est vide
      try {
        const { data } = await withTimeout(
          supabase.from("profiles").select("id").limit(1)
        );
        if (!data || data.length === 0) {
          for (const p of existing.filter((profile) => !String(profile.id).startsWith("default-"))) {
            supabase.from("profiles").upsert([toRemoteProfile(p)]).then(() => {});
          }
        } else {
          // Supabase a déjà des profils — charger depuis Supabase
          await loadFromSupabase();
        }
      } catch (err) {
        console.warn("[profiles] Local/Supabase sync failed:", err.message);
      }
    }
    return;
  }

  // Aucun profil nulle part — créer les defaults
  const now = new Date().toISOString();
  const seeded = DEFAULT_PROFILES.map((p) => ({ ...p, createdAt: now, updatedAt: now }));
  _cache = seeded;
  localStorage.setItem(KEY, JSON.stringify(seeded));

  if (supabase) {
    const remoteSeeded = seeded.filter((profile) => !String(profile.id).startsWith("default-"));
    if (remoteSeeded.length === 0) return;
    try {
      await withTimeout(
        supabase.from("profiles").upsert(remoteSeeded.map(toRemoteProfile))
      );
    } catch (err) {
      console.warn("[profiles] Seeding Supabase failed:", err.message);
    }
  }
}

export async function saveProfile(data) {
  const all = getProfiles();
  const id = data.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const record = sanitizeProfile({ ...data, id, createdAt: data.createdAt || now, updatedAt: now });
  const idx = all.findIndex((p) => p.id === id);
  if (idx >= 0) all[idx] = record; else all.push(record);
  _cache = [...all];
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();

  if (!supabase) return record;
  try {
    await withTimeout(supabase.from("profiles").upsert([toRemoteProfile(record)]));
  } catch (err) {
    console.error("[saveProfile] Supabase failed:", err.message);
  }
  return record;
}

export async function deleteProfile(id) {
  const all = getProfiles().filter((p) => p.id !== id);
  _cache = all;
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();
  if (!supabase) return;
  try {
    await withTimeout(supabase.from("profiles").delete().eq("id", id));
  } catch (err) {
    console.error("[deleteProfile] Supabase failed:", err.message);
  }
}

export function authenticate() {
  console.warn("[profiles] authenticate() legacy désactivé : utilisez Supabase Auth.");
  return null;
}

export function setSession(profile) {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: profile.id, name: profile.name, role: profile.role })
  );
}

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
