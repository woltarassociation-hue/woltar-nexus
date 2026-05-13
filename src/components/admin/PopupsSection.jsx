import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import {
  getAllAnnouncements,
  upsertAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement,
} from "../../lib/popups.js";

const STYLE_OPTIONS = [
  { value: "glass_cyan",   label: "Glass cyan",     desc: "Futuriste" },
  { value: "rouge_woltar", label: "Rouge Woltar",   desc: "Premium" },
  { value: "minimal_manga",label: "Minimal Manga",  desc: "Élégant" },
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

export default function PopupsSection() {
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission("manage_popups") || hasPermission("create_popup");

  const [anns, setAnns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [formError, setFormError] = useState("");

  const reload = () => {
    getAllAnnouncements().then((data) => { setAnns(data); setLoading(false); });
  };

  useEffect(() => { reload(); }, []);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleEdit = (ann) => {
    setForm({
      title:        ann.title || "",
      body:         ann.body  || "",
      style:        ann.style || "glass_cyan",
      type:         ann.type  || "news",
      cta_label:    ann.cta_label   || "",
      cta_url:      ann.cta_url     || "",
      scheduled_at: ann.scheduled_at ? ann.scheduled_at.slice(0, 16) : "",
      expires_at:   ann.expires_at  ? ann.expires_at.slice(0, 16)   : "",
      is_active:    ann.is_active   || false,
    });
    setEditId(ann.id);
    setShowForm(true);
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
      created_by:   user?.id || null,
    });
    setSaving(false);
    if (error) { setFormError(error); return; }
    setForm(EMPTY_FORM); setEditId(null); setShowForm(false);
    reload();
  };

  const handleToggle = async (ann) => {
    await toggleAnnouncement(ann.id, !ann.is_active);
    reload();
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    await deleteAnnouncement(id);
    reload();
  };

  if (loading) return <div className="adm-empty">Chargement…</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 className="adm-section-title" style={{ margin: 0 }}>Annonces popup</h2>
        {canManage && (
          <button className="adm-btn adm-btn--primary" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm((v) => !v); }}>
            {showForm ? "Annuler" : "+ Nouvelle annonce"}
          </button>
        )}
      </div>

      {/* Formulaire */}
      {showForm && canManage && (
        <form className="poll-create-form" onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="adm-field">
              <label className="adm-label">Titre</label>
              <input className="adm-input" value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Titre de l'annonce" />
            </div>
            <div className="adm-field">
              <label className="adm-label">Type</label>
              <select className="adm-input" value={form.type} onChange={(e) => setField("type", e.target.value)}>
                {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="adm-field">
            <label className="adm-label">Contenu</label>
            <textarea className="adm-input" rows={3} value={form.body} onChange={(e) => setField("body", e.target.value)} placeholder="Texte de l'annonce…" />
          </div>

          <div className="adm-field">
            <label className="adm-label">Style</label>
            <div className="ann-popup-style-picker">
              {STYLE_OPTIONS.map((s) => (
                <div
                  key={s.value}
                  className={`ann-style-opt${form.style === s.value ? " ann-style-opt--selected" : ""}`}
                  onClick={() => setField("style", s.value)}
                >
                  <div>{s.label}</div>
                  <div style={{ opacity: 0.55, fontSize: 10, marginTop: 2 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="adm-field">
              <label className="adm-label">Bouton CTA (label)</label>
              <input className="adm-input" value={form.cta_label} onChange={(e) => setField("cta_label", e.target.value)} placeholder="En savoir plus" />
            </div>
            <div className="adm-field">
              <label className="adm-label">Bouton CTA (URL)</label>
              <input className="adm-input" type="url" value={form.cta_url} onChange={(e) => setField("cta_url", e.target.value)} placeholder="https://…" />
            </div>
            <div className="adm-field">
              <label className="adm-label">Programmer (optionnel)</label>
              <input className="adm-input" type="datetime-local" value={form.scheduled_at} onChange={(e) => setField("scheduled_at", e.target.value)} />
            </div>
            <div className="adm-field">
              <label className="adm-label">Expiration (optionnel)</label>
              <input className="adm-input" type="datetime-local" value={form.expires_at} onChange={(e) => setField("expires_at", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
            <input type="checkbox" id="ann-active" checked={form.is_active} onChange={(e) => setField("is_active", e.target.checked)} />
            <label htmlFor="ann-active" className="adm-label" style={{ margin: 0, cursor: "pointer" }}>
              Activer immédiatement
            </label>
          </div>

          {formError && <p className="adm-error">{formError}</p>}
          <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>
            {saving ? "Enregistrement…" : (editId ? "Mettre à jour" : "Créer l'annonce")}
          </button>
        </form>
      )}

      {/* Liste */}
      {anns.length === 0 ? (
        <div className="adm-empty">Aucune annonce configurée.</div>
      ) : (
        <div className="adm-popup-list">
          {anns.map((ann) => (
            <div key={ann.id} className="adm-popup-row">
              <div className={ann.is_active ? "adm-popup-active-dot" : "adm-popup-inactive-dot"} />
              <div className="adm-popup-row__title">{ann.title}</div>
              <div className="adm-popup-row__style">{ann.style} · {ann.type}</div>
              <div className="adm-poll-row__actions">
                {canManage && (
                  <>
                    <button className={`adm-poll-btn${ann.is_active ? "" : " adm-poll-btn--publish"}`} onClick={() => handleToggle(ann)}>
                      {ann.is_active ? "Désactiver" : "Activer"}
                    </button>
                    <button className="adm-poll-btn" onClick={() => handleEdit(ann)}>Éditer</button>
                    <button className="adm-poll-btn" style={{ color: "#ff6060", borderColor: "rgba(255,80,80,0.3)" }} onClick={() => handleDelete(ann.id)}>
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
