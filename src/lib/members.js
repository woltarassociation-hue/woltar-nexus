import { supabase, withTimeout, toDb, fromDb } from "./db.js";

const KEY = "woltar_members";
const SESSION_KEY = "woltar_member_session";

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

// Auto-init + realtime
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

export async function upsertMember(data) {
  const all = getAllMembers();
  const id = data.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...data, id, updatedAt: now, createdAt: data.createdAt || now };
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

export function authenticateMember(pseudo, password) {
  return (
    getAllMembers().find(
      (m) =>
        m.pseudo.trim().toLowerCase() === pseudo.trim().toLowerCase() &&
        m.password === password
    ) || null
  );
}

export function pseudoExists(pseudo, excludeId = null) {
  return getAllMembers().some(
    (m) =>
      m.pseudo.trim().toLowerCase() === pseudo.trim().toLowerCase() &&
      m.id !== excludeId
  );
}

export function setMemberSession(member) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: member.id,
      pseudo: member.pseudo,
      role: member.role || "membre",
      avatar: member.avatar || null,
    })
  );
}

export function getMemberSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}

export function clearMemberSession() {
  localStorage.removeItem(SESSION_KEY);
}

export const MEMBER_ROLE_LABELS = {
  membre: "Membre",
  moderateur: "Modérateur",
  artiste: "Artiste",
  conteur: "Conteur",
};
