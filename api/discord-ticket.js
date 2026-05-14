// Fonction Vercel serverless — envoie une notification Discord
// Le webhook URL est lu uniquement depuis la variable d'environnement serveur.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookUrl = process.env.DISCORD_TICKET_WEBHOOK_URL || null;

  console.log("[Discord] Webhook URL présent:", !!webhookUrl, "Env:", !!process.env.DISCORD_TICKET_WEBHOOK_URL);

  if (!webhookUrl || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    return res.status(200).json({ ok: false, error: "Webhook non configuré" });
  }

  const { pseudo, category, urgency, subject, message, date, enabled } = req.body;

  // Si désactivé côté admin, retourner ok sans envoyer
  if (enabled === false) {
    return res.status(200).json({ ok: false, skipped: true });
  }

  const URGENCY_EMOJI = { Faible: "🟢", Moyenne: "🟡", Haute: "🔴" };

  // Payload Discord avec support des salons Forum
  const threadName = `[${category || "Général"}] ${subject || "Sans sujet"}`.slice(0, 100);

  const embed = {
    title: "🎫 Nouveau ticket Woltar.net",
    color: 0x8b0000,
    fields: [
      { name: "Pseudo", value: pseudo || "Inconnu", inline: true },
      { name: "Catégorie", value: category || "—", inline: true },
      { name: "Urgence", value: `${URGENCY_EMOJI[urgency] || ""} ${urgency || "—"}`, inline: true },
      { name: "Sujet", value: subject || "—", inline: false },
      { name: "Message", value: (message || "—").slice(0, 1024), inline: false },
    ],
    footer: { text: `Woltar.net • ${date || new Date().toLocaleString("fr-FR")} • Statut : Ouvert` },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    content: "🎫 Nouveau ticket Woltar.net",
    embeds: [embed],
    thread_name: threadName, // Pour les salons Forum Discord
  };

  try {
    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const errorText = await r.text();
      console.error("[Discord] Webhook error:", r.status, errorText);
      return res.status(200).json({ ok: false, error: `Discord error (${r.status}): ${errorText}` });
    }
    console.log("[Discord] Message envoyé avec succès");
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[Discord] Erreur fetch:", e.message);
    return res.status(200).json({ ok: false, error: `Erreur: ${e.message}` });
  }
}
