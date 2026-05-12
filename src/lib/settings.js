import { supabase, withTimeout } from "./db.js";

const LS_KEY = "woltar_settings";
let _cache = null;

let _initResolve;
export const settingsReady = new Promise((res) => { _initResolve = res; });

export const SETTING_DEFAULTS = {
  site_name:           "Woltar.net",
  hero_title:          "Bienvenue sur Woltar",
  hero_subtitle:       "Un système planétaire perdu dans l'espace, habité par les Woltariens, Woltariennes et Woltarions.",
  cta_primary:         { label: "Entrer dans l'univers",      href: "/actualites" },
  cta_secondary:       { label: "Découvrir les événements",   href: "/evenements" },
  maintenance_mode:    false,
  maintenance_message: "Site en maintenance. Revenez très bientôt !",
  discord_url:         "https://discord.gg/woltar",
  featured_article_id: null,
  featured_event_id:   null,
};

function dispatch() {
  window.dispatchEvent(new Event("woltar:settings"));
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}

export function getSettings() {
  return { ...SETTING_DEFAULTS, ...(_cache ?? readLocal()) };
}

export function getSetting(key) {
  return getSettings()[key] ?? SETTING_DEFAULTS[key] ?? null;
}

async function loadFromSupabase() {
  if (!supabase) { _initResolve(); return; }
  try {
    const { data, error } = await withTimeout(
      supabase.from("site_settings").select("*")
    );
    if (error) throw error;
    const map = {};
    for (const row of (data || [])) map[row.key] = row.value;
    _cache = map;
    localStorage.setItem(LS_KEY, JSON.stringify(map));
    dispatch();
  } catch (err) {
    console.warn("[settings] load failed:", err.message);
  } finally {
    _initResolve();
  }
}

if (supabase) {
  loadFromSupabase();
  supabase
    .channel("settings-ch")
    .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, loadFromSupabase)
    .subscribe();
} else {
  _initResolve();
}

export async function saveSetting(key, value) {
  const cur = getSettings();
  cur[key] = value;
  _cache = cur;
  try { localStorage.setItem(LS_KEY, JSON.stringify(cur)); } catch {}
  dispatch();

  if (!supabase) return { ok: false, error: "Supabase non configuré" };
  try {
    const { error } = await withTimeout(
      supabase.from("site_settings").upsert([{ key, value, updated_at: new Date().toISOString() }])
    );
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function saveSettings(patch) {
  const cur = getSettings();
  const merged = { ...cur, ...patch };
  _cache = merged;
  try { localStorage.setItem(LS_KEY, JSON.stringify(merged)); } catch {}
  dispatch();

  if (!supabase) return { ok: false, error: "Supabase non configuré" };
  try {
    const rows = Object.entries(patch).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }));
    const { error } = await withTimeout(supabase.from("site_settings").upsert(rows));
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
