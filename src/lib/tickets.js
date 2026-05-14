import { supabase, withTimeout, toDb, fromDb } from "./db.js";

const TICKETS_KEY = "woltar_tickets";
let _cache = null;

function dispatch() {
  window.dispatchEvent(new Event("woltar:tickets"));
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(TICKETS_KEY) || "[]"); } catch { return []; }
}

export function getTickets() {
  return _cache ?? readLocal();
}

async function loadFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await withTimeout(
      supabase.from("tickets").select("*").order("created_at", { ascending: false })
    );
    if (error) throw error;
    _cache = (data || []).map(fromDb);
    localStorage.setItem(TICKETS_KEY, JSON.stringify(_cache));
    dispatch();
  } catch (err) {
    console.warn("[tickets] Supabase load failed:", err.message);
  }
}

// Auto-init + realtime
if (supabase) {
  loadFromSupabase();
  supabase
    .channel("tickets-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, loadFromSupabase)
    .subscribe();
}

export async function saveTicket(ticket) {
  const tickets = getTickets();
  const now = new Date().toISOString();
  const id = ticket.id || crypto.randomUUID();
  const record = { ...ticket, id, createdAt: ticket.createdAt || now, updatedAt: now };
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx >= 0) tickets[idx] = record; else tickets.unshift(record);
  _cache = tickets;
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  dispatch();

  if (!supabase) return { record, syncOk: false };
  try {
    const { error } = await withTimeout(
      supabase.from("tickets").upsert([toDb(record)])
    );
    if (error) throw error;
    return { record, syncOk: true };
  } catch (err) {
    console.error("[saveTicket] Supabase failed:", err.message);
    return { record, syncOk: false, syncError: err.message };
  }
}

export async function deleteTicket(id) {
  const tickets = getTickets().filter((t) => t.id !== id);
  _cache = tickets;
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  dispatch();
  if (!supabase) return;
  try {
    await withTimeout(supabase.from("tickets").delete().eq("id", id));
  } catch (err) {
    console.error("[deleteTicket] Supabase failed:", err.message);
  }
}

export async function updateTicketStatus(id, status) {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx < 0) return;
  tickets[idx] = { ...tickets[idx], status, updatedAt: new Date().toISOString() };
  _cache = [...tickets];
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  dispatch();
  if (!supabase) return;
  try {
    await withTimeout(
      supabase
        .from("tickets")
        .update(toDb({ status, updatedAt: tickets[idx].updatedAt }))
        .eq("id", id)
    );
  } catch (err) {
    console.error("[updateTicketStatus] Supabase failed:", err.message);
  }
}

// Config Discord — le webhook reste exclusivement côté serveur
export function getDiscordConfig() {
  try {
    const safeConfig = JSON.parse(localStorage.getItem("woltar_discord_config") || "{}");
    delete safeConfig.webhookUrl;
    return safeConfig;
  } catch { return {}; }
}

export function saveDiscordConfig(config) {
  const safeConfig = { ...(config || {}) };
  delete safeConfig.webhookUrl;
  localStorage.setItem("woltar_discord_config", JSON.stringify(safeConfig));
}

// Envoyer notification Discord via serverless function
export async function sendDiscordNotification(ticket) {
  const config = getDiscordConfig();
  try {
    const res = await fetch("/api/discord-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...ticket,
        date: new Date(ticket.createdAt).toLocaleString("fr-FR"),
        enabled: config.enabled !== false,
      }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: "Réseau" };
  }
}
