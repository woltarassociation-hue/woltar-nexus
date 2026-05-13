import { supabase, withTimeout, toDb, fromDb } from "./db.js";

const KEY = "woltar_members";

let _cache = null;

function dispatch() {
  window.dispatchEvent(new Event("woltar:members"));
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function getAllMembers() {
  return _cache ?? readLocal();
}

async function loadFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await withTimeout(
      supabase.from("members").select("*").order("created_at", { ascending: false })
    );
    if (error) throw error;
    _cache = (data || []).map(fromDb);
    localStorage.setItem(KEY, JSON.stringify(_cache));
    dispatch();
  } catch (err) {
    console.warn("[members] Supabase load failed:", err.message);
  }
}

if (supabase) {
  loadFromSupabase();
  supabase
    .channel("members-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "members" }, loadFromSupabase)
    .subscribe();
}

export function getMemberById(id) {
  return getAllMembers().find((m) => m.id === id) || null;
}

export function getMemberByAuthId(authId) {
  return getAllMembers().find((m) => m.authId === authId || m.auth_id === authId) || null;
}

export async function upsertMember(data) {
  // Never persist password — auth is handled by Supabase Auth
  const { password, password_hash, ...safeData } = data;
  const all = getAllMembers();
  const id = safeData.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...safeData, id, updatedAt: now, createdAt: safeData.createdAt || now };
  const idx = all.findIndex((m) => m.id === id);
  if (idx >= 0) all[idx] = record; else all.unshift(record);
  _cache = all;
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();

  if (!supabase) return record;
  try {
    await withTimeout(supabase.from("members").upsert([toDb(record)]));
  } catch (err) {
    console.error("[upsertMember] Supabase failed:", err.message);
  }
  return record;
}

export async function deleteMember(id) {
  const all = getAllMembers().filter((m) => m.id !== id);
  _cache = all;
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();
  if (!supabase) return;
  try {
    await withTimeout(supabase.from("members").delete().eq("id", id));
  } catch (err) {
    console.error("[deleteMember] Supabase failed:", err.message);
  }
}

export function pseudoExists(pseudo, excludeId = null) {
  return getAllMembers().some(
    (m) =>
      m.pseudo.trim().toLowerCase() === pseudo.trim().toLowerCase() &&
      m.id !== excludeId
  );
}

export const MEMBER_ROLE_LABELS = {
  membre:     "Membre",
  moderateur: "Modérateur",
  artiste:    "Artiste",
  conteur:    "Conteur",
};
