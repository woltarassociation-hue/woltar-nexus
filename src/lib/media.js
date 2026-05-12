import { supabase, withTimeout } from "./db.js";

const LS_KEY = "woltar_media";
let _cache = null;

function dispatch() { window.dispatchEvent(new Event("woltar:media")); }
function readLocal() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } }

export function getAllMedia() { return _cache ?? readLocal(); }

async function loadFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await withTimeout(
      supabase.from("media").select("*").order("created_at", { ascending: false })
    );
    if (error) throw error;
    _cache = (data || []).map((r) => ({
      id: r.id, name: r.name, url: r.url,
      storagePath: r.storage_path, mimeType: r.mime_type,
      sizeBytes: r.size_bytes, tags: r.tags || [],
      uploadedBy: r.uploaded_by, createdAt: r.created_at,
    }));
    localStorage.setItem(LS_KEY, JSON.stringify(_cache));
    dispatch();
  } catch (err) {
    console.warn("[media] load failed:", err.message);
  }
}

if (supabase) loadFromSupabase();

export async function uploadMedia(file, name) {
  const id = crypto.randomUUID();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const storagePath = `media/${id}.${ext}`;
  let url = null;

  if (supabase) {
    try {
      const { error: upErr } = await withTimeout(
        supabase.storage.from("covers").upload(storagePath, file, { upsert: true })
      );
      if (!upErr) {
        const { data } = supabase.storage.from("covers").getPublicUrl(storagePath);
        url = data?.publicUrl ?? null;
      }
    } catch {}
  }

  if (!url) {
    url = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  const record = {
    id, name: name || file.name, url, storagePath,
    mimeType: file.type, sizeBytes: file.size,
    tags: [], createdAt: new Date().toISOString(),
  };

  const all = [record, ...getAllMedia()];
  _cache = all;
  try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch {}
  dispatch();

  if (supabase && !url.startsWith("data:")) {
    try {
      await withTimeout(supabase.from("media").insert([{
        id, name: record.name, url,
        storage_path: storagePath, mime_type: file.type, size_bytes: file.size, tags: [],
      }]));
    } catch (err) {
      console.warn("[uploadMedia] DB insert failed:", err.message);
    }
  }

  return record;
}

export async function renameMedia(id, name) {
  const all = getAllMedia().map((m) => m.id === id ? { ...m, name } : m);
  _cache = all;
  localStorage.setItem(LS_KEY, JSON.stringify(all));
  dispatch();
  if (!supabase) return;
  try { await withTimeout(supabase.from("media").update({ name }).eq("id", id)); } catch {}
}

export async function deleteMedia(id) {
  const item = getAllMedia().find((m) => m.id === id);
  const all = getAllMedia().filter((m) => m.id !== id);
  _cache = all;
  localStorage.setItem(LS_KEY, JSON.stringify(all));
  dispatch();
  if (!supabase) return;
  try {
    await withTimeout(supabase.from("media").delete().eq("id", id));
    if (item?.storagePath && !item.url?.startsWith("data:")) {
      await supabase.storage.from("covers").remove([item.storagePath]);
    }
  } catch (err) {
    console.warn("[deleteMedia]", err.message);
  }
}

export function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
