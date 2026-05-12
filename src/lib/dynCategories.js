import { supabase, withTimeout, toDb, fromDb } from "./db.js";

const LS_KEY = "woltar_dyn_categories";
let _cache = null;

const DEFAULTS = [
  { id: "cat-actualites", name: "Actualités",  slug: "actualites", icon: "✦",  colorPrimary: "#1fa8dc", colorSecondary: "#8b0000", description: "Mises à jour et règles.",             displayOrder: 1, isPublic: true },
  { id: "cat-prevention", name: "Prévention",  slug: "prevention", icon: "🛡",  colorPrimary: "#1fa8dc", colorSecondary: "#8b0000", description: "Règles de sécurité.",                 displayOrder: 2, isPublic: true },
  { id: "cat-regles",     name: "Règles",      slug: "regles",     icon: "📋",  colorPrimary: "#1fa8dc", colorSecondary: "#8b0000", description: "Règlement communautaire.",             displayOrder: 3, isPublic: true },
  { id: "cat-evenements", name: "Événements",  slug: "evenements", icon: "🎪",  colorPrimary: "#1fa8dc", colorSecondary: "#8b0000", description: "Animations RP et festivités.",        displayOrder: 4, isPublic: true },
  { id: "cat-fanarts",    name: "Fan-arts",    slug: "fanarts",    icon: "🎨",  colorPrimary: "#1fa8dc", colorSecondary: "#8b0000", description: "Créations de la communauté.",         displayOrder: 5, isPublic: true },
  { id: "cat-rp",         name: "RP",          slug: "rp",         icon: "🎭",  colorPrimary: "#1fa8dc", colorSecondary: "#8b0000", description: "Récits et aventures de l'univers.",   displayOrder: 6, isPublic: true },
];

function dispatch() { window.dispatchEvent(new Event("woltar:dyn_categories")); }
function readLocal() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } }

export function getAllCategories() {
  const stored = _cache ?? readLocal();
  return stored.length > 0 ? stored : DEFAULTS;
}

export function getPublicCategories() {
  return getAllCategories().filter((c) => c.isPublic !== false).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export function getCategoryBySlug(slug) {
  return getAllCategories().find((c) => c.slug === slug) ?? null;
}

async function loadFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await withTimeout(
      supabase.from("categories").select("*").order("display_order", { ascending: true })
    );
    if (error) throw error;
    _cache = (data || []).map(fromDb);
    localStorage.setItem(LS_KEY, JSON.stringify(_cache));
    dispatch();
  } catch (err) {
    console.warn("[dynCategories] load failed:", err.message);
  }
}

if (supabase) {
  loadFromSupabase();
  supabase
    .channel("dyn-cat-ch")
    .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, loadFromSupabase)
    .subscribe();
}

export async function upsertCategory(data) {
  const isNew = !data.id || data.id.startsWith("cat-");
  const id = isNew ? crypto.randomUUID() : data.id;
  const now = new Date().toISOString();
  const record = { ...data, id, updatedAt: now, createdAt: data.createdAt || now };

  const all = getAllCategories().filter((c) => !c.id.startsWith("cat-"));
  const idx = all.findIndex((c) => c.id === id);
  if (idx >= 0) all[idx] = record; else all.push(record);
  _cache = all;
  try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch {}
  dispatch();

  if (!supabase) return { record, ok: false, error: "Supabase non configuré" };
  try {
    const { error } = await withTimeout(supabase.from("categories").upsert([toDb(record)]));
    if (error) throw error;
    return { record, ok: true };
  } catch (err) {
    return { record, ok: false, error: err.message };
  }
}

export async function deleteCategory(id) {
  const all = getAllCategories().filter((c) => c.id !== id);
  _cache = all;
  localStorage.setItem(LS_KEY, JSON.stringify(all));
  dispatch();
  if (!supabase) return;
  try { await withTimeout(supabase.from("categories").delete().eq("id", id)); } catch (err) {
    console.error("[deleteCategory]", err.message);
  }
}

export async function reorderCategory(id, direction) {
  const all = [...getAllCategories()];
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return;
  [all[idx].displayOrder, all[swapIdx].displayOrder] = [all[swapIdx].displayOrder, all[idx].displayOrder];
  _cache = all.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  localStorage.setItem(LS_KEY, JSON.stringify(_cache));
  dispatch();
  if (!supabase) return;
  try {
    await withTimeout(supabase.from("categories").upsert([
      toDb(all[idx]),
      toDb(all[swapIdx < idx ? swapIdx : idx]),
    ]));
  } catch {}
}
