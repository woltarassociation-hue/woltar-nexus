import { supabase, withTimeout, toDb, fromDb } from "./db.js";
import { createNotification } from "./social.js";

const LS_KEY = "woltar_articles";
let _cache = null;
let _initResolve;
export const articlesReady = new Promise((res) => {
  _initResolve = res;
});

function dispatch() {
  window.dispatchEvent(new Event("woltar:articles"));
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
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
    _initResolve();
    return;
  }
  try {
    const { data, error } = await withTimeout(
      supabase.from("articles").select("*").order("updated_at", { ascending: false })
    );
    if (error) throw error;
    _cache = (data || []).map(fromDb);
    localStorage.setItem(LS_KEY, JSON.stringify(_cache));
    dispatch();
  } catch (err) {
    console.warn("[articles] Supabase load failed:", err.message);
  } finally {
    _initResolve();
  }
}

if (supabase) {
  loadFromSupabase();
  supabase
    .channel("articles-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, loadFromSupabase)
    .subscribe();
} else {
  _initResolve();
}

function applyWorkflowFields(prev, next, actorProfileId) {
  const out = { ...next };
  const prevStatus = prev?.status || null;
  const status = out.status || "draft";
  const changed = prevStatus !== status;
  const now = new Date().toISOString();
  if (!changed) return out;

  if (status === "submitted") out.submittedAt = out.submittedAt || now;
  if (status === "validated") {
    out.validatedAt = now;
    out.validatedBy = actorProfileId || out.validatedBy || null;
  }
  if (status === "refused") {
    out.refusedAt = now;
    out.refusedBy = actorProfileId || out.refusedBy || null;
  }
  if (status === "published") {
    out.publishedAt = now;
    out.publishedBy = actorProfileId || out.publishedBy || null;
  }
  return out;
}

async function insertWorkflowLog({ articleId, actorProfileId, action, fromStatus, toStatus, note }) {
  if (!supabase || !articleId || !action) return;
  try {
    await withTimeout(
      supabase.from("article_workflow_logs").insert({
        article_id: articleId,
        actor_profile_id: actorProfileId || null,
        action,
        from_status: fromStatus || null,
        to_status: toStatus || null,
        note: note || null,
      })
    );
  } catch {
    // non bloquant
  }
}

export async function upsertArticle(data, options = {}) {
  const id = data.id || crypto.randomUUID();
  const all = getAllArticles();
  const prev = all.find((a) => a.id === id) || null;
  const now = new Date().toISOString();
  const slug = data.slug || prev?.slug || generateSlug(data.title);

  const base = {
    ...prev,
    ...data,
    id,
    slug,
    updatedAt: now,
    createdAt: prev?.createdAt || data.createdAt || now,
    authorProfileId: data.authorProfileId || prev?.authorProfileId || options.actorProfileId || null,
  };
  const record = applyWorkflowFields(prev, base, options.actorProfileId || null);

  const idx = all.findIndex((a) => a.id === id);
  if (idx >= 0) all[idx] = record;
  else all.unshift(record);
  _cache = all;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
  dispatch();

  if (!supabase) {
    return { record, syncOk: false, syncError: "Supabase non configuré" };
  }

  try {
    const { data: saved, error } = await withTimeout(
      supabase.from("articles").upsert([toDb(record)]).select().single()
    );
    if (error) throw error;
    const savedRow = saved ? fromDb(saved) : record;

    const fromStatus = prev?.status || null;
    const toStatus = savedRow.status || null;
    if (fromStatus !== toStatus) {
      await insertWorkflowLog({
        articleId: savedRow.id,
        actorProfileId: options.actorProfileId || null,
        action: options.workflowAction || "status_change",
        fromStatus,
        toStatus,
        note: options.validationNote || null,
      });

      if (savedRow.authorProfileId && options.actorProfileId && savedRow.authorProfileId !== options.actorProfileId) {
        const notifByStatus = {
          validated: { title: "Contenu validé", body: `Votre contenu "${savedRow.title}" a été validé.` },
          refused: { title: "Contenu refusé", body: `Votre contenu "${savedRow.title}" a été refusé.` },
          published: { title: "Contenu publié", body: `Votre contenu "${savedRow.title}" est publié.` },
        };
        const notif = notifByStatus[toStatus];
        if (notif) {
          await createNotification({
            profileId: savedRow.authorProfileId,
            type: `content_${toStatus}`,
            title: notif.title,
            body: notif.body,
          });
        }
      }
    }

    return { record: savedRow, syncOk: true, syncError: null };
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
      supabase.from("articles").update(toDb({ featured: updated.featured, updatedAt: updated.updatedAt })).eq("id", id)
    );
  } catch (err) {
    console.error("[toggleFeatured] Supabase failed:", err.message);
  }
}

export function getPublishedByCategories(categories) {
  const now = new Date();
  return getAllArticles().filter(
    (a) =>
      categories.includes(a.category) &&
      (a.status === "published" ||
        (a.status === "scheduled" && a.scheduledAt && new Date(a.scheduledAt) <= now))
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
