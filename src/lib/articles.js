import { supabase, withTimeout, toDb, fromDb } from "./db.js";

const LS_KEY = "woltar_articles";
let _cache = null;

// Promise qui se résout une fois le premier chargement Supabase terminé
// (succès ou échec). Utilisée par ArticlePage pour ne pas rediriger
// avant d'avoir la réponse Supabase.
let _initResolve;
export const articlesReady = new Promise((res) => { _initResolve = res; });

function dispatch() {
  window.dispatchEvent(new Event("woltar:articles"));
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}

export function generateSlug(title) {
  return (
    (title || "article")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "article"
  );
}

export function getAllArticles() {
  return _cache ?? readLocal();
}

async function loadFromSupabase() {
  if (!supabase) {
    _initResolve(); // Pas de Supabase → résoudre immédiatement
    return;
  }
  try {
    const { data, error } = await withTimeout(
      supabase.from("articles").select("*").order("created_at", { ascending: false })
    );
    if (error) throw error;
    _cache = (data || []).map(fromDb);
    localStorage.setItem(LS_KEY, JSON.stringify(_cache));
    dispatch();
  } catch (err) {
    console.warn("[articles] Supabase load failed:", err.message);
  } finally {
    _initResolve(); // Résoudre dans tous les cas (succès ou échec)
  }
}

// Auto-init + realtime
if (supabase) {
  loadFromSupabase();
  supabase
    .channel("articles-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, loadFromSupabase)
    .subscribe();
} else {
  // Pas de Supabase configuré — résoudre la promesse immédiatement
  _initResolve();
}

export async function upsertArticle(data) {
  const id = data.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const slug = data.slug || generateSlug(data.title);
  const record = { ...data, id, slug, updatedAt: now, createdAt: data.createdAt || now };

  // Mise à jour immédiate du cache et du localStorage
  const all = getAllArticles();
  const idx = all.findIndex((a) => a.id === id);
  if (idx >= 0) all[idx] = record; else all.unshift(record);
  _cache = all;
  try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch {}
  dispatch();

  if (!supabase) {
    return {
      record,
      syncOk: false,
      syncError: "Supabase non configuré — variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes dans Vercel",
    };
  }

  try {
    const { data: saved, error } = await withTimeout(
      supabase.from("articles").upsert([toDb(record)]).select()
    );
    if (error) throw error;
    return { record: saved[0] ? fromDb(saved[0]) : record, syncOk: true, syncError: null };
  } catch (err) {
    console.error("[upsertArticle] Supabase failed:", err.message);
    return { record, syncOk: false, syncError: err.message };
  }
}

export async function deleteArticle(id) {
  const all = getAllArticles().filter((a) => a.id !== id);
  _cache = all;
  localStorage.setItem(LS_KEY, JSON.stringify(all));
  dispatch();
  if (!supabase) return;
  try {
    await withTimeout(supabase.from("articles").delete().eq("id", id));
  } catch (err) {
    console.error("[deleteArticle] Supabase failed:", err.message);
  }
}

export async function toggleFeatured(id) {
  const all = getAllArticles();
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return;
  const updated = { ...all[idx], featured: !all[idx].featured, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  _cache = [...all];
  localStorage.setItem(LS_KEY, JSON.stringify(all));
  dispatch();
  if (!supabase) return;
  try {
    await withTimeout(
      supabase
        .from("articles")
        .update(toDb({ featured: updated.featured, updatedAt: updated.updatedAt }))
        .eq("id", id)
    );
  } catch (err) {
    console.error("[toggleFeatured] Supabase failed:", err.message);
  }
}

export function getPublishedByCategories(categories) {
  return getAllArticles().filter(
    (a) => a.status === "published" && categories.includes(a.category)
  );
}

export function getArticleBySlug(category, slug) {
  return getAllArticles().find((a) => a.category === category && a.slug === slug) || null;
}

export function estimateReadTime(content) {
  if (!content) return 1;
  const text = content.replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export const FONT_STACKS = {
  Georgia: "Georgia, serif",
  Merriweather: "'Merriweather', serif",
  "Playfair Display": "'Playfair Display', serif",
  "Libre Baskerville": "'Libre Baskerville', serif",
  Inter: "'Inter', sans-serif",
  Lato: "'Lato', sans-serif",
  Montserrat: "'Montserrat', sans-serif",
  Poppins: "'Poppins', sans-serif",
  Cinzel: "'Cinzel', serif",
  "Cormorant Garamond": "'Cormorant Garamond', serif",
  "EB Garamond": "'EB Garamond', serif",
  Spectral: "'Spectral', serif",
  "Great Vibes": "'Great Vibes', cursive",
  Allura: "'Allura', cursive",
  "Dancing Script": "'Dancing Script', cursive",
  Parisienne: "'Parisienne', cursive",
  "Cinzel Decorative": "'Cinzel Decorative', cursive",
  "Uncial Antiqua": "'Uncial Antiqua', cursive",
};

export function getFontStack(fontId) {
  return FONT_STACKS[fontId] || "Verdana, sans-serif";
}
