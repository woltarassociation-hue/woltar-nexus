// Fonction Vercel serverless — envoie une notification Discord
// Le webhook URL est prioritairement en variable d'environnement serveur.
// Si absent, utilise le webhookUrl passé dans le body (config dashboard admin).
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Priorité 1 : variable d'environnement serveur (sécurisé)
  // Priorité 2 : webhookUrl passé depuis le dashboard admin (uniquement pour tests admin)
  const webhookUrl =
    process.env.DISCORD_TICKET_WEBHOOK_URL || req.body?.adminWebhookUrl || null;

  if (!webhookUrl || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    return res.status(200).json({ ok: false, error: "Webhook non configuré" });
  }

  const { pseudo, category, urgency, subject, message, date, enabled } = req.body;

  // Si désactivé côté admin, retourner ok sans envoyer
  if (enabled === false) {
    return res.status(200).json({ ok: false, skipped: true });
  }

  const URGENCY_EMOJI = { Faible: "🟢", Moyenne: "🟡", Haute: "🔴" };
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

  try {
    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!r.ok) return res.status(200).json({ ok: false, error: "Discord error" });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}
