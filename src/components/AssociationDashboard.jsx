import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { saveArticle, uploadCoverImage } from "../lib/supabase";
import { getAllArticles, deleteArticle, getFontStack } from "../lib/articles";
import { getAllCandidatures, updateCandidatureStatus, deleteCandidature, exportCandidaturesCSV } from "../lib/candidatures";
import RichTextEditor from "./RichTextEditor";

const stripHtml = (html) =>
  (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/* ── Constants ───────────────────────────────────────────── */

const CATEGORIES = [
  { id: "actualites",  label: "Actualités",  icon: "✦" },
  { id: "prevention",  label: "Prévention",  icon: "🛡" },
  { id: "regles",      label: "Règles",      icon: "📋" },
  { id: "evenements",  label: "Événements",  icon: "🎪" },
  { id: "fanarts",     label: "Fan-arts",    icon: "🎨" },
  { id: "rp",          label: "RP",          icon: "🎭" },
];

const FONT_GROUPS = [
  {
    label: "Calligraphique",
    fonts: [
      { id: "Great Vibes",      stack: "'Great Vibes', cursive" },
      { id: "Allura",           stack: "'Allura', cursive" },
      { id: "Dancing Script",   stack: "'Dancing Script', cursive" },
      { id: "Parisienne",       stack: "'Parisienne', cursive" },
    ],
  },
  {
    label: "Fantasy / Médiéval",
    fonts: [
      { id: "Cinzel Decorative", stack: "'Cinzel Decorative', cursive" },
      { id: "Uncial Antiqua",    stack: "'Uncial Antiqua', cursive" },
      { id: "Cinzel",            stack: "'Cinzel', serif" },
    ],
  },
  {
    label: "Journalistique",
    fonts: [
      { id: "Playfair Display",   stack: "'Playfair Display', serif" },
      { id: "Cormorant Garamond", stack: "'Cormorant Garamond', serif" },
      { id: "Merriweather",       stack: "'Merriweather', serif" },
      { id: "EB Garamond",        stack: "'EB Garamond', serif" },
    ],
  },
  {
    label: "Moderne",
    fonts: [
      { id: "Inter",      stack: "'Inter', sans-serif" },
      { id: "Poppins",    stack: "'Poppins', sans-serif" },
      { id: "Montserrat", stack: "'Montserrat', sans-serif" },
      { id: "Lato",       stack: "'Lato', sans-serif" },
    ],
  },
];

const COLOR_PRESETS = [
  {
    id: "woltar",
    label: "Woltar rouge / cyan",
    font: "Playfair Display",
    titleColor: "#8b0000",
    textColor: "#1a1020",
    accentColor: "#1fa8dc",
    bgColor: "#fdf5f8",
  },
  {
    id: "journal",
    label: "Journal classique",
    font: "Merriweather",
    titleColor: "#1a1a1a",
    textColor: "#2d2d2d",
    accentColor: "#8b6914",
    bgColor: "#fafafa",
  },
  {
    id: "nuit",
    label: "Fantastique nuit",
    font: "Cinzel",
    titleColor: "#c8a8ff",
    textColor: "#d0c8e8",
    accentColor: "#9b6fff",
    bgColor: "#0f0a1e",
  },
  {
    id: "parchemin",
    label: "Parchemin ancien",
    font: "EB Garamond",
    titleColor: "#3d2600",
    textColor: "#4a3520",
    accentColor: "#8b5e3c",
    bgColor: "#f5ead0",
  },
];

const SECTION_MAP = {
  actualites: { label: "Actualités",  route: "/actualites" },
  prevention:  { label: "Prévention", route: "/actualites" },
  regles:      { label: "Règles",     route: "/actualites" },
  evenements:  { label: "Événements", route: "/evenements" },
  fanarts:     { label: "Fan-arts",   route: "/fanarts" },
  rp:          { label: "RP",         route: "/rp" },
};

const EMPTY_FORM = {
  id: null,
  title: "",
  author: "",
  tags: "",
  category: "actualites",
  summary: "",
  content: "",
  coverFile: null,
  coverPreview: null,
  coverUrl: null,
  status: "draft",
  font: "Playfair Display",
  titleColor: "#8b0000",
  textColor: "#1a1020",
  accentColor: "#1fa8dc",
  bgColor: "#fdf5f8",
};

/* ── Main component ──────────────────────────────────────── */

export default function AssociationDashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState("studio");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editorTab, setEditorTab] = useState("content");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [drafts, setDrafts] = useState(() =>
    getAllArticles().filter((a) => a.status === "draft")
  );
  const fileRef = useRef(null);

  useEffect(() => {
    const refresh = () =>
      setDrafts(getAllArticles().filter((a) => a.status === "draft"));
    window.addEventListener("woltar:articles", refresh);
    return () => window.removeEventListener("woltar:articles", refresh);
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const applyImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    set("coverFile", file);
    set("coverPreview", URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    applyImage(e.dataTransfer.files[0]);
  };

  const loadDraft = (draft) => {
    setForm({
      ...EMPTY_FORM,
      ...draft,
      coverFile: null,
      coverPreview: draft.coverUrl || null,
    });
    setEditorTab("content");
    setFeedback(null);
  };

  const handleDeleteDraft = (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer ce brouillon ?")) return;
    deleteArticle(id);
    if (form.id === id) {
      setForm(EMPTY_FORM);
      setFeedback(null);
    }
  };

  const applyPreset = (preset) => {
    setForm((f) => ({
      ...f,
      font: preset.font,
      titleColor: preset.titleColor,
      textColor: preset.textColor,
      accentColor: preset.accentColor,
      bgColor: preset.bgColor,
    }));
  };

  const handleSave = async (status) => {
    setSaving(true);
    setFeedback(null);
    try {
      let coverUrl = form.coverUrl;
      if (form.coverFile) {
        coverUrl = await uploadCoverImage(form.coverFile);
      }
      const record = await saveArticle({
        id: form.id || undefined,
        title: form.title,
        author: form.author,
        tags: form.tags,
        category: form.category,
        summary: form.summary,
        content: form.content,
        coverUrl,
        status,
        font: form.font,
        titleColor: form.titleColor,
        textColor: form.textColor,
        accentColor: form.accentColor,
        bgColor: form.bgColor,
      });

      if (status === "published") {
        const dest = SECTION_MAP[form.category];
        setFeedback({
          type: "success",
          message: `Article publié dans la catégorie "${dest?.label || form.category}".`,
          route: dest?.route,
        });
        setForm(EMPTY_FORM);
      } else {
        setFeedback({ type: "success", message: "Brouillon enregistré." });
        setForm((f) => ({ ...f, id: record.id, coverUrl, coverFile: null }));
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const isDirty = form.title || form.content || form.summary;
    if (isDirty && !window.confirm("Réinitialiser le formulaire ?")) return;
    setForm(EMPTY_FORM);
    setFeedback(null);
  };

  const category = CATEGORIES.find((c) => c.id === form.category);
  const canSave = Boolean(form.title.trim()) && !saving;

  return (
    <div className="dashboard">
      <header className="db-header">
        <button className="db-back-btn" onClick={() => navigate("/")}>
          ← Retour au site
        </button>
        <div className="db-header-brand">
          <img src="/logo_woltar.png" alt="Woltar" className="db-logo" />
          <span className="db-header-title">
            {section === "studio" ? "Studio de publication" : "Candidatures RP"}
          </span>
        </div>
        <div className="db-header-nav">
          <button
            className={`db-nav-btn${section === "studio" ? " db-nav-btn--active" : ""}`}
            onClick={() => setSection("studio")}
          >
            ✏ Studio
          </button>
          <button
            className={`db-nav-btn${section === "candidatures" ? " db-nav-btn--active" : ""}`}
            onClick={() => setSection("candidatures")}
          >
            🎭 Candidatures RP
          </button>
        </div>
      </header>

      {section === "candidatures" && <RPDashboard />}

      <div className="db-body" style={{ display: section === "studio" ? undefined : "none" }}>
        {/* ── Sidebar ── */}
        <aside className="db-sidebar">
          <p className="db-sidebar-label">Sélectionner une catégorie</p>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`db-cat-btn${form.category === cat.id ? " db-cat-btn--active" : ""}`}
              onClick={() => set("category", cat.id)}
            >
              <span className="db-cat-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}

          <div className="db-sidebar-sep" />

          <p className="db-sidebar-label">
            Brouillons
            {drafts.length > 0 && <span className="db-draft-count">{drafts.length}</span>}
          </p>
          {drafts.length === 0 && (
            <p className="db-draft-empty">Aucun brouillon</p>
          )}
          {drafts.map((draft) => (
            <button
              key={draft.id}
              className={`db-draft-item${form.id === draft.id ? " db-draft-item--active" : ""}`}
              onClick={() => loadDraft(draft)}
            >
              <span className="db-draft-info">
                <span className="db-draft-title">{draft.title || "Sans titre"}</span>
                <span className="db-draft-date">
                  {new Date(draft.updatedAt).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short",
                  })}
                </span>
              </span>
              <button
                className="db-draft-del"
                onClick={(e) => handleDeleteDraft(e, draft.id)}
                title="Supprimer"
              >
                ×
              </button>
            </button>
          ))}
        </aside>

        {/* ── Editor ── */}
        <main className="db-editor">
          <div className="db-editor-inner">
            <h2 className="db-editor-heading">
              {form.id
                ? `Modifier${form.title ? ` — ${form.title}` : " le brouillon"}`
                : "Créer un article"}
            </h2>

            {feedback && (
              <div className={`db-feedback db-feedback--${feedback.type}`}>
                <span>{feedback.type === "success" ? "✓" : "✕"} {feedback.message}</span>
                {feedback.route && (
                  <button
                    className="db-feedback-link"
                    onClick={() => navigate(feedback.route)}
                  >
                    Voir sur le site →
                  </button>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="db-tabs">
              <button
                className={`db-tab${editorTab === "content" ? " db-tab--active" : ""}`}
                onClick={() => setEditorTab("content")}
              >
                Contenu
              </button>
              <button
                className={`db-tab${editorTab === "style" ? " db-tab--active" : ""}`}
                onClick={() => setEditorTab("style")}
              >
                Style & Polices
              </button>
            </div>

            {/* Content Tab */}
            {editorTab === "content" && (
              <div>
                <label className="db-label">Titre de l'article</label>
                <input
                  className="db-input"
                  placeholder="Un titre accrocheur…"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />

                <label className="db-label">Auteur</label>
                <input
                  className="db-input"
                  placeholder="Nom de l'auteur ou de l'autrice…"
                  value={form.author}
                  onChange={(e) => set("author", e.target.value)}
                />

                <label className="db-label">Tags (séparés par des virgules)</label>
                <input
                  className="db-input"
                  placeholder="annonce, communauté, 2026…"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                />

                <label className="db-label">Catégorie</label>
                <select
                  className="db-select"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon}  {cat.label}
                    </option>
                  ))}
                </select>

                <label className="db-label">Résumé court</label>
                <input
                  className="db-input"
                  placeholder="Une introduction en quelques mots..."
                  value={form.summary}
                  onChange={(e) => set("summary", e.target.value)}
                />

                <label className="db-label">Contenu de l'article</label>
                <RichTextEditor
                  value={form.content}
                  onChange={(v) => set("content", v)}
                />

                <label className="db-label">Image de couverture</label>
                <div
                  className={`db-upload${dragOver ? " db-upload--drag" : ""}`}
                  onClick={() => fileRef.current.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {form.coverPreview ? (
                    <>
                      <img src={form.coverPreview} alt="Couverture" className="db-upload-img" />
                      <div className="db-upload-change">Changer l'image</div>
                    </>
                  ) : (
                    <div className="db-upload-empty">
                      <span className="db-upload-icon">🖼</span>
                      <span>Cliquez ou glissez une image ici</span>
                      <span className="db-upload-hint">PNG · JPG · WEBP — 5 Mo max</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => applyImage(e.target.files[0])}
                />
              </div>
            )}

            {/* Style Tab */}
            {editorTab === "style" && (
              <div>
                <p className="db-style-section-label">Presets</p>
                <div className="preset-row">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className="preset-chip"
                      onClick={() => applyPreset(preset)}
                    >
                      <span className="preset-dots">
                        <span className="preset-dot" style={{ background: preset.titleColor }} />
                        <span className="preset-dot" style={{ background: preset.accentColor }} />
                        <span className="preset-dot" style={{ background: preset.bgColor, border: "1px solid rgba(0,0,0,0.12)" }} />
                      </span>
                      {preset.label}
                    </button>
                  ))}
                </div>

                <p className="db-style-section-label">Palette de couleurs</p>
                <div className="cp-row">
                  <ColorPicker label="Titre" value={form.titleColor} onChange={(v) => set("titleColor", v)} />
                  <ColorPicker label="Texte" value={form.textColor} onChange={(v) => set("textColor", v)} />
                  <ColorPicker label="Accent" value={form.accentColor} onChange={(v) => set("accentColor", v)} />
                  <ColorPicker label="Fond" value={form.bgColor} onChange={(v) => set("bgColor", v)} />
                </div>

                <p className="db-style-section-label">Police d'écriture</p>
                <FontPicker value={form.font} onChange={(v) => set("font", v)} />
              </div>
            )}

            {/* Actions — always visible */}
            <div className="db-actions">
              <button
                className="db-btn db-btn--draft"
                onClick={() => handleSave("draft")}
                disabled={!canSave}
              >
                {saving ? "Enregistrement…" : "Enregistrer le brouillon"}
              </button>
              <button
                className="db-btn db-btn--publish"
                onClick={() => handleSave("published")}
                disabled={!canSave}
              >
                {saving ? "Publication…" : "Publier →"}
              </button>
              <button className="db-btn db-btn--cancel" onClick={handleCancel}>
                Annuler
              </button>
            </div>
          </div>
        </main>

        {/* ── Preview ── */}
        <aside className="db-preview">
          <p className="db-sidebar-label">Aperçu en direct</p>
          <ArticlePreview form={form} category={category} />
        </aside>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function FontPicker({ value, onChange }) {
  return (
    <div className="fp-wrap">
      {FONT_GROUPS.map((group) => (
        <div key={group.label} className="fp-group">
          <p className="fp-group-label">{group.label}</p>
          <div className="fp-list">
            {group.fonts.map((font) => (
              <button
                key={font.id}
                className={`fp-btn${value === font.id ? " fp-btn--active" : ""}`}
                style={{ fontFamily: font.stack }}
                onClick={() => onChange(font.id)}
              >
                {font.id}
                <span className="fp-btn-sample" style={{ fontFamily: font.stack }}>Aa</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="cp-field">
      <span className="cp-label">{label}</span>
      <div className="cp-swatch-wrap">
        <div className="cp-swatch" style={{ background: value }} />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="cp-input"
          title={value}
        />
      </div>
      <span className="cp-hex">{value}</span>
    </div>
  );
}

/* ── RP Candidature Dashboard ───────────────────────────── */

const STAT_NAMES = ["Agilité", "Perception", "Chance", "Mémoire", "Intelligence", "Créativité", "Charisme", "Force"];

function RPDashboard() {
  const [candidatures, setCandidatures] = useState(() => getAllCandidatures());
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const refresh = () => setCandidatures(getAllCandidatures());
    window.addEventListener("woltar:candidatures", refresh);
    return () => window.removeEventListener("woltar:candidatures", refresh);
  }, []);

  const filtered = candidatures.filter((c) => {
    const matchSearch =
      !search ||
      (c.pseudo || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.nomWoltarien || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: candidatures.length,
    pending: candidatures.filter((c) => c.status === "pending").length,
    accepted: candidatures.filter((c) => c.status === "accepted").length,
    refused: candidatures.filter((c) => c.status === "refused").length,
  };

  const handleStatus = (id, status) => updateCandidatureStatus(id, status);
  const handleDelete = (id) => {
    if (window.confirm("Supprimer cette candidature ?")) deleteCandidature(id);
  };

  return (
    <div className="rp-dash">
      {/* Stats bar */}
      <div className="rp-stats-bar">
        <div className="rp-stat rp-stat--total">
          <span className="rp-stat-num">{counts.total}</span>
          <span className="rp-stat-label">Total</span>
        </div>
        <div className="rp-stat rp-stat--pending">
          <span className="rp-stat-num">{counts.pending}</span>
          <span className="rp-stat-label">En attente</span>
        </div>
        <div className="rp-stat rp-stat--accepted">
          <span className="rp-stat-num">{counts.accepted}</span>
          <span className="rp-stat-label">Acceptées</span>
        </div>
        <div className="rp-stat rp-stat--refused">
          <span className="rp-stat-num">{counts.refused}</span>
          <span className="rp-stat-label">Refusées</span>
        </div>
        {/* Mini bar chart */}
        <div className="rp-stats-chart">
          {counts.total > 0 && (
            <>
              <div
                className="rp-bar rp-bar--accepted"
                style={{ width: `${(counts.accepted / counts.total) * 100}%` }}
                title={`${counts.accepted} acceptées`}
              />
              <div
                className="rp-bar rp-bar--pending"
                style={{ width: `${(counts.pending / counts.total) * 100}%` }}
                title={`${counts.pending} en attente`}
              />
              <div
                className="rp-bar rp-bar--refused"
                style={{ width: `${(counts.refused / counts.total) * 100}%` }}
                title={`${counts.refused} refusées`}
              />
            </>
          )}
          {counts.total === 0 && (
            <div className="rp-bar rp-bar--empty" style={{ width: "100%" }} />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="rp-controls">
        <input
          className="rp-search"
          type="search"
          placeholder="Rechercher par pseudo ou nom woltarien…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="rp-filter-btns">
          {[
            { id: "all",      label: "Toutes" },
            { id: "pending",  label: "En attente" },
            { id: "accepted", label: "Acceptées" },
            { id: "refused",  label: "Refusées" },
          ].map((f) => (
            <button
              key={f.id}
              className={`rp-filter-btn rp-filter-btn--${f.id}${filterStatus === f.id ? " rp-filter-btn--active" : ""}`}
              onClick={() => setFilterStatus(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          className="rp-export-btn"
          onClick={() => exportCandidaturesCSV(filtered)}
          disabled={filtered.length === 0}
        >
          ↓ Exporter CSV ({filtered.length})
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rp-empty">
          <span className="rp-empty-icon">🎭</span>
          <p>Aucune candidature trouvée</p>
        </div>
      ) : (
        <div className="rp-list">
          {filtered.map((c) => {
            const total = STAT_NAMES.reduce((s, k) => s + (c.stats?.[k] ?? 0), 0);
            const isOpen = expanded === c.id;
            return (
              <div key={c.id} className={`rp-card rp-card--${c.status}`}>
                <div className="rp-card-header" onClick={() => setExpanded(isOpen ? null : c.id)}>
                  <div className="rp-card-identity">
                    <span className="rp-card-pseudo">{c.pseudo || "—"}</span>
                    {c.nomWoltarien && (
                      <span className="rp-card-nom">✦ {c.nomWoltarien}</span>
                    )}
                  </div>
                  <div className="rp-card-meta">
                    <span className="rp-card-pts">{total} pts</span>
                    <span className={`rp-status-badge rp-status-badge--${c.status}`}>
                      {c.status === "accepted" ? "Accepté" : c.status === "refused" ? "Refusé" : "En attente"}
                    </span>
                    <span className="rp-card-date">
                      {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                    <span className="rp-card-toggle">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="rp-card-body">
                    <div className="rp-stats-grid">
                      {STAT_NAMES.map((stat) => {
                        const val = c.stats?.[stat] ?? 0;
                        return (
                          <div key={stat} className="rp-stat-row">
                            <span className="rp-stat-name">{stat}</span>
                            <div className="rp-stat-bar-wrap">
                              <div
                                className="rp-stat-bar-fill"
                                style={{ width: `${Math.min(100, (val / 20) * 100)}%` }}
                              />
                            </div>
                            <span className="rp-stat-val">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="rp-card-actions">
                      <button
                        className="rp-action-btn rp-action-btn--accept"
                        onClick={() => handleStatus(c.id, "accepted")}
                        disabled={c.status === "accepted"}
                      >
                        ✓ Accepter
                      </button>
                      <button
                        className="rp-action-btn rp-action-btn--refuse"
                        onClick={() => handleStatus(c.id, "refused")}
                        disabled={c.status === "refused"}
                      >
                        ✕ Refuser
                      </button>
                      <button
                        className="rp-action-btn rp-action-btn--reset"
                        onClick={() => handleStatus(c.id, "pending")}
                        disabled={c.status === "pending"}
                      >
                        ↺ Remettre en attente
                      </button>
                      <button
                        className="rp-action-btn rp-action-btn--delete"
                        onClick={() => handleDelete(c.id)}
                      >
                        🗑 Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ArticlePreview({ form, category }) {
  const fontStack = getFontStack(form.font);
  return (
    <div className="ap-card" style={{ background: form.bgColor, fontFamily: fontStack }}>
      {form.coverPreview ? (
        <div className="ap-cover">
          <img src={form.coverPreview} alt="Couverture" />
          <div className="ap-cover-overlay" />
        </div>
      ) : (
        <div className="ap-cover ap-cover--empty">
          <span>Pas d'image</span>
        </div>
      )}

      <div className="ap-body">
        {category && (
          <span className="ap-category" style={{ color: form.accentColor }}>
            {category.icon} {category.label}
          </span>
        )}

        <h3 className="ap-title" style={{ color: form.titleColor, fontFamily: fontStack }}>
          {form.title || <span className="ap-placeholder">Titre de l'article</span>}
        </h3>

        {form.summary && (
          <p className="ap-summary" style={{ color: form.textColor }}>{form.summary}</p>
        )}

        <div className="ap-content" style={{ borderColor: `${form.accentColor}33` }}>
          {form.content ? (
            <p style={{ color: form.textColor }}>
              {(() => { const t = stripHtml(form.content); return t.length > 220 ? t.slice(0, 220) + "…" : t; })()}
            </p>
          ) : (
            <p className="ap-placeholder">Le contenu apparaîtra ici…</p>
          )}
        </div>

        <div className="ap-footer" style={{ borderColor: `${form.accentColor}33` }}>
          <span
            className="ap-badge"
            style={{ background: `${form.accentColor}1a`, color: form.accentColor }}
          >
            {form.status === "published" ? "Publié" : "Brouillon"}
          </span>
          <span className="ap-date">
            {new Date().toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
