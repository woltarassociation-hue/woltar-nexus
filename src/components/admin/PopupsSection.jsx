import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import {
  getAllAnnouncements,
  upsertAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement,
} from "../../lib/popups.js";

// ── Constantes ─────────────────────────────────────────────────
const STYLE_OPTIONS = [
  {
    value: "glass_cyan",
    label: "Glass Cyan",
    emoji: "💠",
    desc: "Futuriste",
  },
  {
    value: "rouge_woltar",
    label: "Rouge Woltar",
    emoji: "🔴",
    desc: "Premium",
  },
  {
    value: "minimal_manga",
    label: "Minimal Manga",
    emoji: "📋",
    desc: "Élégant",
  },
];

const TYPE_OPTIONS = [
  { value: "news",        label: "Actualité" },
  { value: "event",       label: "Événement" },
  { value: "maintenance", label: "Maintenance" },
];

const EMPTY_FORM = {
  title: "", body: "", style: "glass_cyan", type: "news",
  cta_label: "", cta_url: "", scheduled_at: "", expires_at: "",
  is_active: false,
};

// ── Composant principal ────────────────────────────────────────
export default function PopupsSection() {
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission("manage_popups") || hasPermission("create_popup");

  const [anns, setAnns]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");

  const reload = () => {
    getAllAnnouncements().then((data) => { setAnns(data); setLoading(false); });
  };

  useEffect(() => { reload(); }, []);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFormError("");
    setShowForm((v) => !v);
  };

  const handleEdit = (ann) => {
    setForm({
      title:        ann.title        || "",
      body:         ann.body         || "",
      style:        ann.style        || "glass_cyan",
      type:         ann.type         || "news",
      cta_label:    ann.cta_label    || "",
      cta_url:      ann.cta_url      || "",
      scheduled_at: ann.scheduled_at ? ann.scheduled_at.slice(0, 16) : "",
      expires_at:   ann.expires_at   ? ann.expires_at.slice(0, 16)   : "",
      is_active:    ann.is_active    || false,
    });
    setEditId(ann.id);
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim()) { setFormError("Titre requis."); return; }
    if (!form.body.trim())  { setFormError("Contenu requis."); return; }
    setSaving(true);
    const { error } = await upsertAnnouncement({
      ...(editId ? { id: editId } : {}),
      title:        form.title.trim(),
      body:         form.body.trim(),
      style:        form.style,
      type:         form.type,
      cta_label:    form.cta_label.trim() || null,
      cta_url:      form.cta_url.trim()   || null,
      scheduled_at: form.scheduled_at     || null,
      expires_at:   form.expires_at       || null,
      is_active:    form.is_active,
      created_by:   user?.id              || null,
    });
    setSaving(false);
    if (error) { setFormError(error); return; }
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
    reload();
  };

  const handleToggle = async (ann) => {
    await toggleAnnouncement(ann.id, !ann.is_active);
    reload();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette annonce définitivement ?")) return;
    await deleteAnnouncement(id);
    reload();
  };

  if (loading) return (
    <div className="rpx-panel">
      <div className="rpx-empty">Chargement…</div>
    </div>
  );

  return (
    <div className="rpx-panel">
      {/* Header */}
      <div className="rpx-panel-header">
        <h2 className="rpx-page-title">◈ ANNONCES</h2>
        {canManage && (
          <button
            className="rpx-btn rpx-btn--primary"
            onClick={openNew}
          >
            {showForm && !editId ? "Annuler" : "+ Nouvelle annonce"}
          </button>
        )}
      </div>

      {/* ── Formulaire ── */}
      {showForm && canManage && (
        <form className="rpx-form" onSubmit={handleSubmit}>
          {/* Ligne 1 : titre + type */}
          <div className="rpx-form-grid rpx-form-grid--2">
            <div className="rpx-field">
              <label className="rpx-label">Titre</label>
              <input
                className="rpx-input"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Titre de l'annonce"
              />
            </div>
            <div className="rpx-field">
              <label className="rpx-label">Type</label>
              <select
                className="rpx-input"
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contenu */}
          <div className="rpx-field">
            <label className="rpx-label">Contenu</label>
            <textarea
              className="rpx-input rpx-textarea"
              rows={3}
              value={form.body}
              onChange={(e) => setField("body", e.target.value)}
              placeholder="Texte de l'annonce…"
            />
          </div>

          {/* Sélecteur de style visuel */}
          <div className="rpx-field">
            <label className="rpx-label">Style visuel</label>
            <div className="rpx-style-cards">
              {STYLE_OPTIONS.map((s) => (
                <div
                  key={s.value}
                  className={`rpx-style-card rpx-style-card--${s.value}${form.style === s.value ? " rpx-style-card--active" : ""}`}
                  onClick={() => setField("style", s.value)}
                >
                  <div className="rpx-style-card__preview">{s.emoji}</div>
                  <div className="rpx-style-card__label">{s.label}</div>
                  <div className="rpx-style-card__desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rpx-form-grid rpx-form-grid--2">
            <div className="rpx-field">
              <label className="rpx-label">Bouton CTA — Label</label>
              <input
                className="rpx-input"
                value={form.cta_label}
                onChange={(e) => setField("cta_label", e.target.value)}
                placeholder="En savoir plus"
              />
            </div>
            <div className="rpx-field">
              <label className="rpx-label">Bouton CTA — URL</label>
              <input
                className="rpx-input"
                type="url"
                value={form.cta_url}
                onChange={(e) => setField("cta_url", e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="rpx-form-grid rpx-form-grid--2">
            <div className="rpx-field">
              <label className="rpx-label">Programmer (optionnel)</label>
              <input
                className="rpx-input"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setField("scheduled_at", e.target.value)}
              />
            </div>
            <div className="rpx-field">
              <label className="rpx-label">Expiration (optionnel)</label>
              <input
                className="rpx-input"
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setField("expires_at", e.target.value)}
              />
            </div>
          </div>

          {/* Toggle activer */}
          <label className="rpx-toggle-row">
            <span className="rpx-toggle">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setField("is_active", e.target.checked)}
              />
              <span className="rpx-toggle-slider" />
            </span>
            <span className="rpx-label" style={{ margin: 0 }}>Activer immédiatement</span>
          </label>

          {formError && <p className="rpx-error">{formError}</p>}

          <button type="submit" className="rpx-btn rpx-btn--primary" disabled={saving}>
            {saving ? "Enregistrement…" : (editId ? "Mettre à jour" : "Créer l'annonce")}
          </button>
        </form>
      )}

      {/* ── Liste des annonces ── */}
      {anns.length === 0 ? (
        <div className="rpx-empty">Aucune annonce configurée.</div>
      ) : (
        <div className="rpx-ann-list">
          {anns.map((ann) => (
            <div
              key={ann.id}
              className={`rpx-ann-row${ann.is_active ? " rpx-ann-row--active" : ""}`}
            >
              <span
                className="rpx-ann-dot"
                style={{ background: ann.is_active ? "#2ecc71" : "#555" }}
              />
              <div className="rpx-ann-title">{ann.title}</div>
              <div className="rpx-ann-meta">{ann.style} · {ann.type}</div>
              {canManage && (
                <div className="rpx-ann-actions">
                  <button
                    className="rpx-btn rpx-btn--sm"
                    onClick={() => handleToggle(ann)}
                  >
                    {ann.is_active ? "Désactiver" : "Activer"}
                  </button>
                  <button
                    className="rpx-btn rpx-btn--sm"
                    onClick={() => handleEdit(ann)}
                  >
                    Éditer
                  </button>
                  <button
                    className="rpx-btn rpx-btn--sm rpx-btn--danger"
                    onClick={() => handleDelete(ann.id)}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
