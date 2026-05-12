import { useState, useEffect } from "react";
import { getAllCategories, upsertCategory, deleteCategory, reorderCategory } from "../../lib/dynCategories";

const EMPTY = {
  id: null, name: "", slug: "", description: "", icon: "✦",
  colorPrimary: "#1fa8dc", colorSecondary: "#8b0000",
  imageUrl: "", displayOrder: 99, isPublic: true,
};

function slugify(str) {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

export default function CategoriesSection() {
  const [cats, setCats] = useState(() => getAllCategories());
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const refresh = () => setCats(getAllCategories());
    window.addEventListener("woltar:dyn_categories", refresh);
    return () => window.removeEventListener("woltar:dyn_categories", refresh);
  }, []);

  const openNew = () => setEditing({ ...EMPTY, displayOrder: cats.length + 1 });
  const openEdit = (cat) => setEditing({ ...cat });
  const cancel = () => { setEditing(null); setFeedback(null); };

  const set = (k, v) => setEditing((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!editing.name.trim()) return;
    setSaving(true);
    const data = {
      ...editing,
      slug: editing.slug || slugify(editing.name),
    };
    const { ok, error } = await upsertCategory(data);
    setSaving(false);
    if (ok) { setFeedback({ type: "success", message: "✓ Catégorie sauvegardée." }); setEditing(null); }
    else setFeedback({ type: "error", message: `✗ ${error}` });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer la catégorie "${name}" ?`)) return;
    await deleteCategory(id);
  };

  const handleReorder = async (id, dir) => {
    await reorderCategory(id, dir);
  };

  const sorted = [...cats].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <div className="adm-wrap">
      <div className="adm-inner">
        <div className="adm-top-row">
          <h2 className="adm-title">Catégories</h2>
          <button className="db-btn db-btn--publish" style={{ marginTop: 0 }} onClick={openNew}>+ Nouvelle catégorie</button>
        </div>

        {feedback && (
          <div className={`db-feedback db-feedback--${feedback.type}`}>{feedback.message}</div>
        )}

        {/* Formulaire édition */}
        {editing && (
          <div className="adm-card adm-card--form">
            <div className="adm-card-title">{editing.id && !editing.id.startsWith("cat-") ? "Modifier" : "Nouvelle catégorie"}</div>
            <div className="adm-two-col">
              <div>
                <label className="db-label">Nom</label>
                <input className="db-input" value={editing.name} onChange={(e) => { set("name", e.target.value); if (!editing.id || editing.id.startsWith("cat-")) set("slug", slugify(e.target.value)); }} />
                <label className="db-label">Slug (URL)</label>
                <input className="db-input" value={editing.slug} onChange={(e) => set("slug", e.target.value)} placeholder="ex: actualites" />
              </div>
              <div>
                <label className="db-label">Icône</label>
                <input className="db-input" value={editing.icon} onChange={(e) => set("icon", e.target.value)} placeholder="✦" style={{ fontSize: 20 }} />
                <label className="db-label">Ordre</label>
                <input className="db-input" type="number" value={editing.displayOrder} onChange={(e) => set("displayOrder", Number(e.target.value))} />
              </div>
            </div>
            <label className="db-label">Description</label>
            <input className="db-input" value={editing.description} onChange={(e) => set("description", e.target.value)} />
            <div className="adm-two-col" style={{ marginTop: 14 }}>
              <div>
                <label className="db-label">Couleur principale</label>
                <div className="adm-color-row">
                  <input type="color" value={editing.colorPrimary} onChange={(e) => set("colorPrimary", e.target.value)} className="adm-color-pick" />
                  <input className="db-input" value={editing.colorPrimary} onChange={(e) => set("colorPrimary", e.target.value)} style={{ fontFamily: "monospace", flex: 1 }} />
                </div>
              </div>
              <div>
                <label className="db-label">Couleur secondaire</label>
                <div className="adm-color-row">
                  <input type="color" value={editing.colorSecondary} onChange={(e) => set("colorSecondary", e.target.value)} className="adm-color-pick" />
                  <input className="db-input" value={editing.colorSecondary} onChange={(e) => set("colorSecondary", e.target.value)} style={{ fontFamily: "monospace", flex: 1 }} />
                </div>
              </div>
            </div>
            <label className="adm-toggle-row" style={{ marginTop: 16 }}>
              <input type="checkbox" checked={!!editing.isPublic} onChange={(e) => set("isPublic", e.target.checked)} />
              <span className="adm-toggle-label">Visible publiquement</span>
            </label>
            <div className="db-actions">
              <button className="db-btn db-btn--publish" onClick={handleSave} disabled={saving || !editing.name.trim()}>
                {saving ? "Sauvegarde…" : "Sauvegarder"}
              </button>
              <button className="db-btn db-btn--cancel" onClick={cancel}>Annuler</button>
            </div>
          </div>
        )}

        {/* Liste */}
        <div className="adm-cat-list">
          {sorted.map((cat, idx) => (
            <div key={cat.id} className="adm-cat-row">
              <span className="adm-cat-icon" style={{ fontSize: 22 }}>{cat.icon}</span>
              <div className="adm-cat-info">
                <span className="adm-cat-name">{cat.name}</span>
                <span className="adm-cat-slug">/{cat.slug}</span>
                {cat.description && <span className="adm-cat-desc">{cat.description}</span>}
              </div>
              <div className="adm-cat-dots">
                <span className="adm-dot" style={{ background: cat.colorPrimary }} title={cat.colorPrimary} />
                <span className="adm-dot" style={{ background: cat.colorSecondary }} title={cat.colorSecondary} />
              </div>
              <span className={`adm-badge ${cat.isPublic ? "adm-badge--ok" : "adm-badge--off"}`}>
                {cat.isPublic ? "Public" : "Masqué"}
              </span>
              <div className="adm-cat-actions">
                <button className="adm-icon-btn" onClick={() => handleReorder(cat.id, "up")} disabled={idx === 0} title="Monter">↑</button>
                <button className="adm-icon-btn" onClick={() => handleReorder(cat.id, "down")} disabled={idx === sorted.length - 1} title="Descendre">↓</button>
                <button className="adm-icon-btn" onClick={() => openEdit(cat)} title="Modifier">✏</button>
                <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => handleDelete(cat.id, cat.name)} title="Supprimer">×</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
