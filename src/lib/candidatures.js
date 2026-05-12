import { supabase, withTimeout, toDb, fromDb } from "./db.js";

const KEY = "woltar_rp_candidatures";
let _cache = null;

function dispatch() {
  window.dispatchEvent(new Event("woltar:candidatures"));
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function getAllCandidatures() {
  return _cache ?? readLocal();
}

async function loadFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await withTimeout(
      supabase.from("candidatures").select("*").order("created_at", { ascending: false })
    );
    if (error) throw error;
    _cache = (data || []).map(fromDb);
    localStorage.setItem(KEY, JSON.stringify(_cache));
    dispatch();
  } catch (err) {
    console.warn("[candidatures] Supabase load failed:", err.message);
  }
}

// Auto-init + realtime
if (supabase) {
  loadFromSupabase();
  supabase
    .channel("candidatures-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "candidatures" }, loadFromSupabase)
    .subscribe();
}

export async function saveCandidature(data) {
  const all = getAllCandidatures();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...data, id, status: "pending", createdAt: now };
  all.unshift(record);
  _cache = all;
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();

  if (!supabase) return record;
  try {
    await withTimeout(supabase.from("candidatures").insert([toDb(record)]));
  } catch (err) {
    console.error("[saveCandidature] Supabase failed:", err.message);
  }
  return record;
}

export async function updateCandidatureStatus(id, status) {
  const all = getAllCandidatures();
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() };
  _cache = [...all];
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();
  if (!supabase) return;
  try {
    await withTimeout(
      supabase
        .from("candidatures")
        .update(toDb({ status, updatedAt: all[idx].updatedAt }))
        .eq("id", id)
    );
  } catch (err) {
    console.error("[updateCandidatureStatus] Supabase failed:", err.message);
  }
}

export async function deleteCandidature(id) {
  const all = getAllCandidatures().filter((c) => c.id !== id);
  _cache = all;
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();
  if (!supabase) return;
  try {
    await withTimeout(supabase.from("candidatures").delete().eq("id", id));
  } catch (err) {
    console.error("[deleteCandidature] Supabase failed:", err.message);
  }
}

export function exportCandidaturesCSV(candidatures) {
  const STAT_NAMES = ["Agilité", "Perception", "Chance", "Mémoire", "Intelligence", "Créativité", "Charisme", "Force"];
  const headers = ["Pseudo", "Nom woltarien", ...STAT_NAMES, "Total pts", "Statut", "Date"];
  const rows = candidatures.map((c) => {
    const total = STAT_NAMES.reduce((s, k) => s + (c.stats?.[k] ?? 0), 0);
    return [
      c.pseudo ?? "",
      c.nomWoltarien ?? "",
      ...STAT_NAMES.map((s) => c.stats?.[s] ?? 0),
      total,
      c.status === "accepted" ? "Accepté" : c.status === "refused" ? "Refusé" : "En attente",
      new Date(c.createdAt).toLocaleDateString("fr-FR"),
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `candidatures_rp_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
