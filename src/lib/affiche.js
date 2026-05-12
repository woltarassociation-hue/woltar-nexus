import { supabase, withTimeout, toDb, fromDb } from "./db.js";

const LS_KEY = "woltar_affiche";
const SINGLETON_ID = "singleton";

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return null; }
}

function dispatch() {
  window.dispatchEvent(new Event("woltar:affiche"));
}

export function getAffiche() {
  return readLocal();
}

export async function loadAffiche() {
  if (!supabase) return;
  try {
    const { data, error } = await withTimeout(
      supabase.from("event_highlights").select("*").eq("id", SINGLETON_ID).maybeSingle()
    );
    if (error) throw error;
    if (!data) return;
    const record = fromDb(data);
    // Retire l'id interne avant de stocker localement
    const { id: _id, ...rest } = record;
    localStorage.setItem(LS_KEY, JSON.stringify(rest));
    dispatch();
  } catch (err) {
    console.warn("[affiche] Supabase load failed:", err.message);
  }
}

export async function saveAffiche(data) {
  const now = new Date().toISOString();
  const record = { ...data, updatedAt: now, createdAt: data.createdAt || now };
  localStorage.setItem(LS_KEY, JSON.stringify(record));
  dispatch();

  if (!supabase) return record;
  try {
    const { error } = await withTimeout(
      supabase
        .from("event_highlights")
        .upsert([{ ...toDb(record), id: SINGLETON_ID }])
    );
    if (error) throw error;
  } catch (err) {
    console.error("[saveAffiche] Supabase failed:", err.message);
  }
  return record;
}

export async function clearAffiche() {
  localStorage.removeItem(LS_KEY);
  dispatch();
  if (!supabase) return;
  try {
    await withTimeout(
      supabase.from("event_highlights").delete().eq("id", SINGLETON_ID)
    );
  } catch (err) {
    console.error("[clearAffiche] Supabase failed:", err.message);
  }
}

// Auto-init + realtime
if (supabase) {
  loadAffiche();
  supabase
    .channel("affiche-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "event_highlights" }, loadAffiche)
    .subscribe();
}
