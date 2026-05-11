// Test simple du webhook Discord
// Lance cette route : /api/test-discord-webhook

export default async function handler(req, res) {
  const webhookUrl = process.env.DISCORD_TICKET_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("[Test Discord] DISCORD_TICKET_WEBHOOK_URL non défini");
    return res.status(200).json({ error: "DISCORD_TICKET_WEBHOOK_URL non configuré" });
  }

  console.log("[Test Discord] URL présente, test d'envoi...");

  try {
    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "🎫 Test webhook Woltar.net : connexion Discord OK"
      })
    });

    if (!r.ok) {
      const errorText = await r.text();
      console.error("[Test Discord] Erreur webhook:", r.status, errorText);
      return res.status(200).json({
        success: false,
        error: `Discord error (${r.status}): ${errorText}`
      });
    }

    console.log("[Test Discord] ✅ Test réussi");
    return res.status(200).json({ success: true, message: "Webhook Discord fonctionne" });
  } catch (e) {
    console.error("[Test Discord] Erreur fetch:", e.message);
    return res.status(200).json({ success: false, error: e.message });
  }
}
