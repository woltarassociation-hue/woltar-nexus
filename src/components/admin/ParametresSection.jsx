import { useState, useEffect } from "react";
import { getAllArticles } from "../../lib/articles";
import { getSettings, saveSettings, settingsReady } from "../../lib/settings";

export default function ParametresSection() {
  const [s, setS] = useState(() => getSettings());
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const articles = getAllArticles().filter((a) => a.status === "published");
  const events   = articles.filter((a) => a.category === "evenements");

  useEffect(() => {
    settingsReady.then(() => setS(getSettings()));
    const refresh = () => setS(getSettings());
    window.addEventListener("woltar:settings", refresh);
    return () => window.removeEventListener("woltar:settings", refresh);
  }, []);

  const set = (key, val) => setS((prev) => ({ ...prev, [key]: val }));
  const setCta = (which, field, val) =>
    setS((prev) => ({ ...prev, [which]: { ...(prev[which] || {}), [field]: val } }));

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    const { ok, error } = await saveSettings(s);
    setSaving(false);
    setFeedback({ type: ok ? "success" : "error", message: ok ? "✓ Paramètres sauvegardés." : `✗ ${error}` });
  };

  return (
    <div className="adm-wrap">
      <div className="adm-inner">
        <h2 className="adm-title">Paramètres du site</h2>

        {/* Identité */}
        <div className="adm-group">
          <div className="adm-group-label">Identité</div>
          <label className="db-label">Nom du site</label>
          <input className="db-input" value={s.site_name || ""} onChange={(e) => set("site_name", e.target.value)} placeholder="Woltar.net" />
        </div>

        {/* Hero */}
        <div className="adm-group">
          <div className="adm-group-label">Section Hero</div>
          <label className="db-label">Titre principal</label>
          <input className="db-input" value={s.hero_title || ""} onChange={(e) => set("hero_title", e.target.value)} />
          <label className="db-label">Sous-titre</label>
          <textarea className="db-textarea" style={{ minHeight: 72 }} value={s.hero_subtitle || ""} onChange={(e) => set("hero_subtitle", e.target.value)} />
          <div className="adm-two-col">
            <div>
              <label className="db-label">CTA principal — Texte</label>
              <input className="db-input" value={s.cta_primary?.label || ""} onChange={(e) => setCta("cta_primary", "label", e.target.value)} />
              <label className="db-label">CTA principal — Lien</label>
              <input className="db-input" value={s.cta_primary?.href || ""} onChange={(e) => setCta("cta_primary", "href", e.target.value)} placeholder="/actualites" />
            </div>
            <div>
              <label className="db-label">CTA secondaire — Texte</label>
              <input className="db-input" value={s.cta_secondary?.label || ""} onChange={(e) => setCta("cta_secondary", "label", e.target.value)} />
              <label className="db-label">CTA secondaire — Lien</label>
              <input className="db-input" value={s.cta_secondary?.href || ""} onChange={(e) => setCta("cta_secondary", "href", e.target.value)} placeholder="/evenements" />
            </div>
          </div>
        </div>

        {/* Mise en avant */}
        <div className="adm-group">
          <div className="adm-group-label">Mise en avant</div>
          <label className="db-label">Article spotlight (laisser vide = dernier article événement)</label>
          <select className="db-select" value={s.featured_article_id || ""} onChange={(e) => set("featured_article_id", e.target.value || null)}>
            <option value="">— Automatique —</option>
            {articles.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
          <label className="db-label">Événement spotlight</label>
          <select className="db-select" value={s.featured_event_id || ""} onChange={(e) => set("featured_event_id", e.target.value || null)}>
            <option value="">— Automatique —</option>
            {events.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        </div>

        {/* Réseaux */}
        <div className="adm-group">
          <div className="adm-group-label">Réseaux & liens</div>
          <label className="db-label">Discord URL</label>
          <input className="db-input" value={s.discord_url || ""} onChange={(e) => set("discord_url", e.target.value)} placeholder="https://discord.gg/..." />
        </div>

        {/* Maintenance */}
        <div className="adm-group">
          <div className="adm-group-label">Mode maintenance</div>
          <label className="adm-toggle-row">
            <input
              type="checkbox"
              checked={!!s.maintenance_mode}
              onChange={(e) => set("maintenance_mode", e.target.checked)}
            />
            <span className="adm-toggle-label">Activer le mode maintenance</span>
            {s.maintenance_mode && <span className="adm-badge adm-badge--danger">ACTIF</span>}
          </label>
          {s.maintenance_mode && (
            <>
              <label className="db-label" style={{ marginTop: 14 }}>Message affiché aux visiteurs</label>
              <textarea
                className="db-textarea"
                style={{ minHeight: 72 }}
                value={s.maintenance_message || ""}
                onChange={(e) => set("maintenance_message", e.target.value)}
              />
            </>
          )}
        </div>

        {feedback && (
          <div className={`db-feedback db-feedback--${feedback.type}`} style={{ marginBottom: 0 }}>
            {feedback.message}
          </div>
        )}

        <div className="db-actions">
          <button className="db-btn db-btn--publish" onClick={handleSave} disabled={saving}>
            {saving ? "Sauvegarde…" : "Sauvegarder les paramètres"}
          </button>
        </div>
      </div>
    </div>
  );
}
