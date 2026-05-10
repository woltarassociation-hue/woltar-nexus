const KEY = "woltar_rp_candidatures";

function dispatch() {
  window.dispatchEvent(new Event("woltar:candidatures"));
}

export function getAllCandidatures() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCandidature(data) {
  const all = getAllCandidatures();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...data, id, status: "pending", createdAt: now };
  all.unshift(record);
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();
  return record;
}

export function updateCandidatureStatus(id, status) {
  const all = getAllCandidatures();
  const idx = all.findIndex((c) => c.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(all));
    dispatch();
  }
}

export function deleteCandidature(id) {
  const all = getAllCandidatures().filter((c) => c.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
  dispatch();
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
