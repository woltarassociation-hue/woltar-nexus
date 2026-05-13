import { useState, useEffect } from "react";
import { getAllCategories, upsertCategory, deleteCategory, reorderCategory } from "../../lib/dynCategories";

// ── Helpers ────────────────────────────────────────────────────
const EMPTY = {
  id: null, name: "", slug: "", description: "", icon: "✦",
  colorPrimary: "#1fa8dc", colorSecondary: "#8b0000",
  imageUrl: "", displayOrder: 99, isPublic: true,
};

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ── Composant principal ────────────────────────────────────────
export default function CategoriesSection() {
  const [cats, setCats]       = useState(() => getAllCategories());
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const refresh = () => setCats(getAllCategories());
    window.addEventListener("woltar:dyn_categories", refresh);
    return () => window.removeEventListener("woltar:dyn_categories", refresh);
  }, []);

  const openNew  = () => setEditing({ ...EMPTY, displayOrder: cats.length + 1 });
  const openEdit = (cat) => setEditing({ ...cat });
  const cancel   = () => { setEditing(null); setFeedback(null); };

  const set = (k, v) => setEditing((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!editing.name.trim()) return;
    setSaving(true);
    setFeedback(null);
    const data = {
      ...editing,
      slug: editing.slug || slugify(editing.name),
    };
    const { ok, error } = await upsertCategory(data);
    setSaving(false);
    if (ok) {
      setFeedback({ type: "success", message: "✓ Catégorie sauvegardée." });
      setEditing(null);
    } else {
      setFeedback({ type: "error", message: `✗ ${error}` });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer la catégorie "${name}" ?`)) return;
    await deleteCategory(id);
  };

  const handleReorder = async (id, dir) => {
    await reorderCategory(id, dir);
  };

  const sorted = [...cats].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const isNew  = !editing?.id || String(editing.id).startsWith("cat-");

  return (
    <div className="rpx-panel">
      {/* Header */}
      <div className="rpx-panel-header">
        <h2 className="rpx-page-title">◈ CATÉGORIES</h2>
        <button className="rpx-btn rpx-btn--primary" onClick={openNew}>
          + Nouvelle
        </button>
      </div>

      {/* Feedback global */}
      {feedback && !editing && (
        <div className={`rpx-feedback rpx-feedback--${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {/* ── Formulaire édition / création ── */}
      {editing && (
        <div className="rpx-panel rpx-panel--inner">
          <div className="rpx-section-title">
            {isNew ? "Nouvelle catégorie" : "Modifier la catégorie"}
          </div>

          {feedback && (
            <div className={`rpx-feedback rpx-feedback--${feedback.type}`}>
              {feedback.message}
            </div>
          )}

          {/* Nom + Slug */}
          <div className="rpx-form-grid rpx-form-grid--2">
            <div className="rpx-field">
              <label className="rpx-label">Nom</label>
              <input
                className="rpx-input"
                value={editing.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (isNew) set("slug", slugify(e.target.value));
                }}
                placeholder="Nom de la catégorie"
              />
            </div>
            <div className="rpx-field">
              <label className="rpx-label">Slug (URL)</label>
              <input
                className="rpx-input"
                value={editing.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="ex: actualites"
                style={{ fontFamily: "monospace" }}
              />
            </div>
          </div>

          {/* Icône + Ordre */}
          <div className="rpx-form-grid rpx-form-grid--2">
            <div className="rpx-field">
              <label className="rpx-label">Icône</label>
              <input
                className="rpx-input"
                value={editing.icon}
                onChange={(e) => set("icon", e.target.value)}
                placeholder="✦"
                style={{ fontSize: 20 }}
              />
            </div>
            <div className="rpx-field">
              <label className="rpx-label">Ordre d'affichage</label>
              <input
                className="rpx-input"
                type="number"
                value={editing.displayOrder}
                onChange={(e) => set("displayOrder", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Description pleine largeur */}
          <div className="rpx-field">
            <label className="rpx-label">Description</label>
            <input
              className="rpx-input"
              value={editing.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Courte description de la catégorie"
            />
          </div>

          {/* Color pickers */}
          <div className="rpx-form-grid rpx-form-grid--2">
            <div className="rpx-field">
              <label className="rpx-label">Couleur principale</label>
              <div className="rpx-color-row">
                <input
                  type="color"
                  className="rpx-color-pick"
                  value={editing.colorPrimary}
                  onChange={(e) => set("colorPrimary", e.target.value)}
                />
                <input
                  className="rpx-input"
                  value={editing.colorPrimary}
                  onChange={(e) => set("colorPrimary", e.target.value)}
                  style={{ fontFamily: "monospace", flex: 1 }}
                />
              </div>
            </div>
            <div className="rpx-field">
              <label className="rpx-label">Couleur secondaire</label>
              <div className="rpx-color-row">
                <input
                  type="color"
                  className="rpx-color-pick"
                  value={editing.colorSecondary}
                  onChange={(e) => set("colorSecondary", e.target.value)}
                />
                <input
                  className="rpx-input"
                  value={editing.colorSecondary}
                  onChange={(e) => set("colorSecondary", e.target.value)}
                  style={{ fontFamily: "monospace", flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Toggle public */}
          <label className="rpx-toggle-row" style={{ marginTop: 16 }}>
            <span className="rpx-toggle">
              <input
                type="checkbox"
                checked={!!editing.isPublic}
                onChange={(e) => set("isPublic", e.target.checked)}
              />
              <span className="rpx-toggle-slider" />
            </span>
            <span className="rpx-label" style={{ margin: 0 }}>Visible publiquement</span>
          </label>

          {/* Boutons */}
          <div className="rpx-form-actions">
            <button
              className="rpx-btn rpx-btn--primary"
              onClick={handleSave}
              disabled={saving || !editing.name.trim()}
            >
              {saving ? "Sauvegarde…" : "Sauvegarder"}
            </button>
            <button className="rpx-btn" onClick={cancel}>Annuler</button>
          </div>
        </div>
      )}

      {/* ── Grille des catégories ── */}
      {sorted.length === 0 ? (
        <div className="rpx-empty">Aucune catégorie.</div>
      ) : (
        <div className="rpx-cat-grid">
          {sorted.map((cat, idx) => (
            <div
              key={cat.id}
              className="rpx-cat-card"
              style={{
                "--cat-border": cat.colorPrimary,
                "--cat-shadow": cat.colorPrimary + "44",
              }}
            >
              <div className="rpx-cat-card__icon">{cat.icon}</div>
              <div className="rpx-cat-card__name">{cat.name}</div>
              <div className="rpx-cat-card__slug">/{cat.slug}</div>

              <div className="rpx-cat-card__colors">
                <span
                  className="rpx-dot"
                  style={{ background: cat.colorPrimary }}
                  title={cat.colorPrimary}
                />
                <span
                  className="rpx-dot"
                  style={{ background: cat.colorSecondary }}
                  title={cat.colorSecondary}
                />
              </div>

              <span
                className={`rpx-badge ${cat.isPublic ? "rpx-badge--active" : "rpx-badge--draft"}`}
              >
                {cat.isPublic ? "Public" : "Masqué"}
              </span>

              <div className="rpx-cat-card__actions">
                <button
                  className="rpx-btn rpx-btn--sm"
                  onClick={() => handleReorder(cat.id, "up")}
                  disabled={idx === 0}
                  title="Monter"
                >
                  ↑
                </button>
                <button
                  className="rpx-btn rpx-btn--sm"
                  onClick={() => handleReorder(cat.id, "down")}
                  disabled={idx === sorted.length - 1}
                  title="Descendre"
                >
                  ↓
                </button>
                <button
                  className="rpx-btn rpx-btn--sm"
                  onClick={() => openEdit(cat)}
                  title="Modifier"
                >
                  ✏
                </button>
                <button
                  className="rpx-btn rpx-btn--sm rpx-btn--danger"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  title="Supprimer"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
