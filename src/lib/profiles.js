import { supabase, withTimeout, toDb, fromDb } from "./db.js";

const KEY = "woltar_profiles";
const SESSION_KEY = "woltar_session";

let _cache = null;

export const ROLE_LABELS = {
  admin: "Administrateur",
  artiste: "Artistes",
  communication: "Communication",
  custom: "Personnalisé",
};

const DEFAULT_PROFILES = [
  { id: "default-admin",  name: "Administrateur", role: "admin",         username: "association",   password: "woltar2026" },
  { id: "default-artiste", name: "Artistes",       role: "artiste",       username: "artiste",       password: "woltar2026" },
  { id: "default-comm",   name: "Communication",   role: "communication", username: "communication", password: "woltar2026" },
];

function readLocal() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    return stored && stored.length > 0 ? stored : null;
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
      _cache = data.map(fromDb);
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
          for (const p of existing) {
            supabase.from("profiles").upsert([toDb(p)]).then(() => {});
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
    try {
      await withTimeout(
        supabase.from("profiles").upsert(seeded.map(toDb))
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
  const record = { ...data, id, createdAt: data.createdAt || now, updatedAt: now };
  const idx = all.findIndex((p) => p.id === id);
  if (idx >= 0) all[idx] = record; else all.push(record);
  _cache = [...all];
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();

  if (!supabase) return record;
  try {
    await withTimeout(supabase.from("profiles").upsert([toDb(record)]));
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

export function authenticate(username, password) {
  return getProfiles().find(
    (p) =>
      p.username.trim().toLowerCase() === username.trim().toLowerCase() &&
      p.password === password
  ) || null;
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
