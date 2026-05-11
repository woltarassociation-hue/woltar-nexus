// CRUD tickets dans localStorage
// Structure ticket :
// { id, pseudo, email, category, subject, message, urgency, imageUrl?,
//   status: "Ouvert"|"En cours"|"Résolu"|"Fermé",
//   createdAt, updatedAt }
//
// Config Discord stockée dans localStorage (admin seulement) :
// woltar_discord_config = { webhookUrl, enabled }

const TICKETS_KEY = "woltar_tickets";

export function getTickets() {
  try {
    return JSON.parse(localStorage.getItem(TICKETS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTicket(ticket) {
  const tickets = getTickets();
  const now = new Date().toISOString();
  const idx = tickets.findIndex((t) => t.id === ticket.id);
  if (idx >= 0) {
    tickets[idx] = { ...tickets[idx], ...ticket, updatedAt: now };
  } else {
    tickets.unshift({ ...ticket, createdAt: ticket.createdAt || now, updatedAt: now });
  }
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  window.dispatchEvent(new Event("woltar:tickets"));
}

export function deleteTicket(id) {
  const tickets = getTickets().filter((t) => t.id !== id);
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  window.dispatchEvent(new Event("woltar:tickets"));
}

export function updateTicketStatus(id, status) {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === id);
  if (idx >= 0) {
    tickets[idx] = { ...tickets[idx], status, updatedAt: new Date().toISOString() };
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
    window.dispatchEvent(new Event("woltar:tickets"));
  }
}

export function getDiscordConfig() {
  try {
    return JSON.parse(localStorage.getItem("woltar_discord_config") || "{}");
  } catch {
    return {};
  }
}

export function saveDiscordConfig(config) {
  localStorage.setItem("woltar_discord_config", JSON.stringify(config));
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
        adminWebhookUrl: config.webhookUrl || undefined,
      }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { ok: false, error: "Réseau" };
  }
}
