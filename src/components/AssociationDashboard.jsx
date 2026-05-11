import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { saveArticle, uploadCoverImage } from "../lib/supabase";
import { getAllArticles, deleteArticle, toggleFeatured, getFontStack } from "../lib/articles";
import { getAllCandidatures, updateCandidatureStatus, deleteCandidature, exportCandidaturesCSV } from "../lib/candidatures";
import { getProfiles, saveProfile, deleteProfile, getSession, clearSession, ROLE_LABELS } from "../lib/profiles";
import { getAllMembers, upsertMember, deleteMember, MEMBER_ROLE_LABELS } from "../lib/members";
import { compressImage } from "../lib/imageUtils";
import { getSubcategories } from "../lib/subcategories";
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
  subcategory: "",
  summary: "",
  content: "",
  coverFile: null,
  coverPreview: null,
  coverUrl: null,
  coverMode: "banner",
  status: "draft",
  font: "Playfair Display",
  titleFont: "Playfair Display",
  bodyFont: "Merriweather",
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
      const { record, syncOk, syncError } = await saveArticle({
        id: form.id || undefined,
        title: form.title,
        author: form.author,
        tags: form.tags,
        category: form.category,
        subcategory: form.subcategory || "",
        summary: form.summary,
        content: form.content,
        coverUrl,
        coverMode: form.coverMode || "banner",
        status,
        font: form.font,
        titleFont: form.titleFont,
        bodyFont: form.bodyFont,
        titleColor: form.titleColor,
        textColor: form.textColor,
        accentColor: form.accentColor,
        bgColor: form.bgColor,
      });

      if (status === "published") {
        const dest = SECTION_MAP[form.category];
        const articleRoute = `/${form.category}/${record.slug}`;
        setFeedback({
          type: syncError ? "warning" : "success",
          message: syncError
            ? `✓ Article publié dans "${dest?.label || form.category}" (sauvegardé localement).`
            : `✓ Article publié dans "${dest?.label || form.category}".`,
          route: articleRoute,
          routeLabel: "Voir l'article →",
        });
        setForm(EMPTY_FORM);
      } else {
        setFeedback({
          type: syncError ? "warning" : "success",
          message: syncError
            ? "✓ Brouillon enregistré localement."
            : "✓ Brouillon enregistré.",
        });
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

  const handleEditArticle = (article) => {
    loadDraft(article);
    setSection("studio");
    window.scrollTo(0, 0);
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
            {{ studio: "Studio de publication", articles: "Mes articles", candidatures: "Candidatures RP", affiche: "Affiche événement", profils: "Profils & Accès", membres: "Membres" }[section]}
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
            className={`db-nav-btn${section === "articles" ? " db-nav-btn--active" : ""}`}
            onClick={() => setSection("articles")}
          >
            📰 Mes articles
          </button>
          <button
            className={`db-nav-btn${section === "candidatures" ? " db-nav-btn--active" : ""}`}
            onClick={() => setSection("candidatures")}
          >
            🎭 Candidatures RP
          </button>
          <button
            className={`db-nav-btn${section === "affiche" ? " db-nav-btn--active" : ""}`}
            onClick={() => setSection("affiche")}
          >
            🖼 Affiche événement
          </button>
          <button
            className={`db-nav-btn${section === "profils" ? " db-nav-btn--active" : ""}`}
            onClick={() => setSection("profils")}
          >
            👥 Profils
          </button>
          <button
            className={`db-nav-btn${section === "membres" ? " db-nav-btn--active" : ""}`}
            onClick={() => setSection("membres")}
          >
            🧑‍🤝‍🧑 Membres
          </button>
        </div>
        <button
          className="db-logout-btn"
          title="Se déconnecter"
          onClick={() => { clearSession(); navigate("/"); }}
        >
          ⎋ Déconnexion
        </button>
      </header>

      {section === "articles" && <ArticlesManager onEdit={handleEditArticle} />}
      {section === "candidatures" && <RPDashboard />}
      {section === "affiche" && <AfficheSection />}
      {section === "profils" && <ProfilesSection />}
      {section === "membres" && <MembresSection />}

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
                <span>{feedback.message}</span>
                {feedback.route && (
                  <button
                    className="db-feedback-link"
                    onClick={() => navigate(feedback.route)}
                  >
                    {feedback.routeLabel || "Voir sur le site →"}
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
                  onChange={(e) => { set("category", e.target.value); set("subcategory", ""); }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon}  {cat.label}
                    </option>
                  ))}
                </select>

                {getSubcategories(form.category).length > 0 && (
                  <>
                    <label className="db-label">Sous-catégorie (optionnel)</label>
                    <select
                      className="db-select"
                      value={form.subcategory || ""}
                      onChange={(e) => set("subcategory", e.target.value)}
                    >
                      <option value="">— Aucune —</option>
                      {getSubcategories(form.category).map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.icon} {sub.label}</option>
                      ))}
                    </select>
                  </>
                )}

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

                {form.coverPreview && (
                  <div className="db-covermode-wrap">
                    <label className="db-label">Affichage de l'image</label>
                    <div className="db-covermode-btns">
                      <button
                        type="button"
                        className={`db-covermode-btn${(form.coverMode || "banner") === "banner" ? " db-covermode-btn--active" : ""}`}
                        onClick={() => set("coverMode", "banner")}
                      >
                        🎬 Bannière recadrée
                      </button>
                      <button
                        type="button"
                        className={`db-covermode-btn${form.coverMode === "full" ? " db-covermode-btn--active" : ""}`}
                        onClick={() => set("coverMode", "full")}
                      >
                        📄 Image complète (A4)
                      </button>
                    </div>
                  </div>
                )}
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

                <p className="db-style-section-label">Police du titre</p>
                <FontSelect value={form.titleFont} onChange={(v) => set("titleFont", v)} />

                <p className="db-style-section-label">Police du texte</p>
                <FontSelect value={form.bodyFont} onChange={(v) => set("bodyFont", v)} />
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

function FontSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const allFonts = FONT_GROUPS.flatMap((g) => g.fonts);
  const selected = allFonts.find((f) => f.id === value);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="fsel-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`fsel-trigger${open ? " fsel-trigger--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="fsel-current" style={{ fontFamily: selected?.stack }}>
          {value || "Choisir une police…"}
        </span>
        <span className="fsel-sample" style={{ fontFamily: selected?.stack }}>
          Aa
        </span>
        <span className="fsel-arrow">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="fsel-dropdown">
          {FONT_GROUPS.map((group) => (
            <div key={group.label} className="fsel-group">
              <p className="fsel-group-label">{group.label}</p>
              {group.fonts.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  className={`fsel-item${value === font.id ? " fsel-item--active" : ""}`}
                  onClick={() => { onChange(font.id); setOpen(false); }}
                >
                  <span className="fsel-item-name" style={{ fontFamily: font.stack }}>
                    {font.id}
                  </span>
                  <span className="fsel-item-sample" style={{ fontFamily: font.stack }}>
                    Le renard rapide
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
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

/* ── Gestion des articles ───────────────────────────────── */

const CAT_ALL = { id: "all", label: "Tous les articles", icon: "◈" };
const CAT_LIST = [
  { id: "actualites",  label: "Actualités",  icon: "✦" },
  { id: "prevention",  label: "Prévention",  icon: "🛡" },
  { id: "regles",      label: "Règles",      icon: "📋" },
  { id: "evenements",  label: "Événements",  icon: "🎪" },
  { id: "fanarts",     label: "Fan-arts",    icon: "🎨" },
  { id: "rp",          label: "RP",          icon: "🎭" },
];

function ArticlesManager({ onEdit }) {
  const [articles, setArticles] = useState(() => getAllArticles());
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const refresh = () => setArticles(getAllArticles());
    window.addEventListener("woltar:articles", refresh);
    return () => window.removeEventListener("woltar:articles", refresh);
  }, []);

  const filtered = articles.filter((a) => {
    const matchCat = activeCat === "all" || a.category === activeCat;
    const matchSearch = !search || (a.title || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const countByCat = (catId) => articles.filter((a) => a.category === catId).length;

  const handleDelete = (id) => {
    if (!window.confirm("Supprimer cet article définitivement ?")) return;
    deleteArticle(id);
    setDeleteId(null);
  };

  const handleToggleFeatured = (id) => {
    toggleFeatured(id);
  };

  const published = filtered.filter((a) => a.status === "published");
  const drafts    = filtered.filter((a) => a.status === "draft");

  return (
    <div className="artmgr-wrap">
      {/* Top bar */}
      <div className="artmgr-topbar">
        <div>
          <h2 className="artmgr-heading">Mes articles</h2>
          <p className="artmgr-sub">
            {articles.length} article{articles.length !== 1 ? "s" : ""} au total —{" "}
            {articles.filter((a) => a.status === "published").length} publiés,{" "}
            {articles.filter((a) => a.status === "draft").length} brouillons
          </p>
        </div>
        <input
          className="artmgr-search"
          type="search"
          placeholder="Rechercher par titre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="artmgr-layout">
        {/* Sidebar catégories */}
        <nav className="artmgr-sidebar">
          {[CAT_ALL, ...CAT_LIST].map((cat) => {
            const count = cat.id === "all" ? articles.length : countByCat(cat.id);
            return (
              <button
                key={cat.id}
                className={`artmgr-cat-btn${activeCat === cat.id ? " artmgr-cat-btn--active" : ""}`}
                onClick={() => setActiveCat(cat.id)}
              >
                <span className="artmgr-cat-icon">{cat.icon}</span>
                <span className="artmgr-cat-label">{cat.label}</span>
                <span className="artmgr-cat-count">{count}</span>
              </button>
            );
          })}
        </nav>

        {/* Liste articles */}
        <div className="artmgr-main">
          {filtered.length === 0 ? (
            <div className="artmgr-empty">
              <span className="artmgr-empty-icon">📰</span>
              <p>{search ? "Aucun résultat pour cette recherche." : "Aucun article dans cette catégorie."}</p>
            </div>
          ) : (
            <>
              {published.length > 0 && (
                <div className="artmgr-group">
                  <p className="artmgr-group-label">
                    Publiés <span className="artmgr-group-count">{published.length}</span>
                  </p>
                  {published.map((a) => (
                    <ArticleRow key={a.id} article={a} onEdit={onEdit} onDelete={handleDelete} onToggleFeatured={handleToggleFeatured} />
                  ))}
                </div>
              )}
              {drafts.length > 0 && (
                <div className="artmgr-group">
                  <p className="artmgr-group-label">
                    Brouillons <span className="artmgr-group-count">{drafts.length}</span>
                  </p>
                  {drafts.map((a) => (
                    <ArticleRow key={a.id} article={a} onEdit={onEdit} onDelete={handleDelete} onToggleFeatured={handleToggleFeatured} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleRow({ article, onEdit, onDelete, onToggleFeatured }) {
  const cat = CAT_LIST.find((c) => c.id === article.category) || { label: article.category, icon: "✦" };
  const isPublished = article.status === "published";

  return (
    <div className={`artmgr-row${article.featured ? " artmgr-row--featured" : ""}`}>
      {/* Thumbnail */}
      <div className="artmgr-thumb">
        {article.coverUrl ? (
          <img src={article.coverUrl} alt="" onError={(e) => { e.target.style.display = "none"; }} />
        ) : (
          <span className="artmgr-thumb-icon">{cat.icon}</span>
        )}
      </div>

      {/* Info */}
      <div className="artmgr-info">
        <div className="artmgr-title-line">
          <span className="artmgr-title">{article.title || "Sans titre"}</span>
          {article.featured && (
            <span className="artmgr-featured-badge">⭐ En avant</span>
          )}
        </div>
        <div className="artmgr-meta">
          <span className="artmgr-cat-tag">{cat.icon} {cat.label}</span>
          {article.author && <span className="artmgr-author">par {article.author}</span>}
          <span className="artmgr-date">
            {new Date(article.updatedAt || article.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </span>
          <span className={`artmgr-status artmgr-status--${article.status}`}>
            {isPublished ? "● Publié" : "○ Brouillon"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="artmgr-actions">
        {isPublished && (
          <button
            className={`artmgr-star-btn${article.featured ? " artmgr-star-btn--on" : ""}`}
            onClick={() => onToggleFeatured(article.id)}
            title={article.featured ? "Retirer du carousel" : "Mettre en avant dans le carousel"}
          >
            {article.featured ? "⭐" : "☆"}
          </button>
        )}
        <button
          className="artmgr-btn artmgr-btn--edit"
          onClick={() => onEdit(article)}
        >
          ✏ Modifier
        </button>
        <button
          className="artmgr-btn artmgr-btn--delete"
          onClick={() => onDelete(article.id)}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

/* ── Profils & Accès ────────────────────────────────────── */

const EMPTY_PROFILE = { id: null, name: "", role: "custom", username: "", password: "" };

function ProfilesSection() {
  const session = getSession();
  const [profiles, setProfiles] = useState(() => getProfiles());
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [editing, setEditing] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const refresh = () => setProfiles(getProfiles());
    window.addEventListener("woltar:profiles", refresh);
    return () => window.removeEventListener("woltar:profiles", refresh);
  }, []);

  const setF = (key, val) => { setForm((f) => ({ ...f, [key]: val })); setSaved(false); };

  const handleEdit = (profile) => {
    setForm({ ...profile });
    setEditing(true);
    setSaved(false);
  };

  const handleNew = () => {
    setForm(EMPTY_PROFILE);
    setEditing(true);
    setSaved(false);
  };

  const handleSave = () => {
    if (!form.username.trim() || !form.name.trim() || !form.password.trim()) return;
    const conflict = profiles.find(
      (p) => p.username.toLowerCase() === form.username.toLowerCase() && p.id !== form.id
    );
    if (conflict) { alert("Cet identifiant est déjà utilisé par un autre profil."); return; }
    saveProfile(form);
    setEditing(false);
    setSaved(true);
    setForm(EMPTY_PROFILE);
  };

  const handleDelete = (id) => {
    if (profiles.length <= 1) { alert("Impossible de supprimer le dernier profil."); return; }
    if (!window.confirm("Supprimer ce profil définitivement ?")) return;
    deleteProfile(id);
  };

  const handleCancel = () => { setEditing(false); setForm(EMPTY_PROFILE); };

  const roleColor = { admin: "#8b0000", artiste: "#1fa8dc", communication: "#1a7a3c", custom: "#7a4fa0" };

  return (
    <div className="prof-section">
      <div className="prof-header">
        <div>
          <h2 className="prof-heading">Profils &amp; Accès</h2>
          <p className="prof-desc">
            Gérez les comptes ayant accès au tableau de bord. Chaque profil possède son propre identifiant et mot de passe.
            {session && <span className="prof-session"> Connecté en tant que <strong>{session.name}</strong>.</span>}
          </p>
          <p className="prof-note">⚠ Les identifiants sont stockés localement sur cet appareil.</p>
        </div>
        {!editing && (
          <button className="prof-new-btn" onClick={handleNew}>
            + Nouveau profil
          </button>
        )}
      </div>

      {/* Form */}
      {editing && (
        <div className="prof-form">
          <h3 className="prof-form-title">{form.id ? "Modifier le profil" : "Nouveau profil"}</h3>
          <div className="prof-form-grid">
            <div className="prof-form-field">
              <label className="prof-label">Nom du profil</label>
              <input
                className="db-input"
                placeholder="Ex : Communication"
                value={form.name}
                onChange={(e) => setF("name", e.target.value)}
              />
            </div>
            <div className="prof-form-field">
              <label className="prof-label">Rôle</label>
              <select className="db-select" value={form.role} onChange={(e) => setF("role", e.target.value)}>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="prof-form-field">
              <label className="prof-label">Identifiant de connexion</label>
              <input
                className="db-input"
                placeholder="Ex : mario.comm"
                value={form.username}
                onChange={(e) => setF("username", e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="prof-form-field">
              <label className="prof-label">Mot de passe</label>
              <div className="prof-pass-wrap">
                <input
                  className="db-input prof-pass-input"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setF("password", e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="prof-pass-toggle"
                  onClick={() => setShowPass((v) => !v)}
                  title={showPass ? "Masquer" : "Afficher"}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>
          </div>
          <div className="prof-form-actions">
            <button className="db-btn db-btn--publish prof-save-btn" onClick={handleSave}>
              {form.id ? "✓ Enregistrer les paramètres" : "✓ Créer le profil"}
            </button>
            <button className="db-btn db-btn--cancel" onClick={handleCancel}>Annuler</button>
          </div>
        </div>
      )}

      {/* Profiles list */}
      <div className="prof-list">
        {profiles.map((p) => (
          <div key={p.id} className="prof-card">
            <div className="prof-card-left">
              <span
                className="prof-role-dot"
                style={{ background: roleColor[p.role] || "#999" }}
                title={ROLE_LABELS[p.role] || p.role}
              />
              <div className="prof-card-info">
                <span className="prof-card-name">{p.name}</span>
                <span className="prof-card-username">@{p.username}</span>
              </div>
              <span
                className="prof-role-badge"
                style={{ background: `${roleColor[p.role] || "#999"}18`, color: roleColor[p.role] || "#999" }}
              >
                {ROLE_LABELS[p.role] || p.role}
              </span>
              {session?.id === p.id && (
                <span className="prof-you-badge">Vous</span>
              )}
            </div>
            <div className="prof-card-actions">
              <button className="prof-action-btn prof-action-btn--edit" onClick={() => handleEdit(p)}>
                ✏ Modifier
              </button>
              <button
                className="prof-action-btn prof-action-btn--delete"
                onClick={() => handleDelete(p.id)}
                disabled={profiles.length <= 1}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Affiche événement ──────────────────────────────────── */

const AFFICHE_KEY = "woltar_affiche";

function AfficheSection() {
  const fileRef = useRef(null);
  const [affiche, setAffiche] = useState(() => {
    try { return JSON.parse(localStorage.getItem(AFFICHE_KEY) || "null"); } catch { return null; }
  });
  const [form, setForm] = useState({
    title: affiche?.title || "",
    summary: affiche?.summary || "",
    dateStart: affiche?.dateStart || "",
    dateEnd: affiche?.dateEnd || "",
    link: affiche?.link || "",
    imageUrl: affiche?.imageUrl || "",
    imageFile: null,
    preview: affiche?.imageUrl || null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const setF = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setF("imageFile", file);
    setF("preview", URL.createObjectURL(file));
    setSaved(false);
    setSaveError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      let imageUrl = form.imageUrl;
      if (form.imageFile) {
        imageUrl = await compressImage(form.imageFile, { maxWidth: 1200, maxHeight: 1600, quality: 0.82 });
      }
      const record = {
        title: form.title,
        summary: form.summary,
        dateStart: form.dateStart,
        dateEnd: form.dateEnd,
        link: form.link,
        imageUrl,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(AFFICHE_KEY, JSON.stringify(record));
      window.dispatchEvent(new Event("woltar:affiche"));
      setAffiche(record);
      setF("imageUrl", imageUrl);
      setF("imageFile", null);
      setSaved(true);
    } catch (err) {
      console.error("[AfficheSection] handleSave:", err);
      setSaveError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (!window.confirm("Retirer l'affiche de la page d'accueil ?")) return;
    localStorage.removeItem(AFFICHE_KEY);
    window.dispatchEvent(new Event("woltar:affiche"));
    setAffiche(null);
    setForm({ title: "", summary: "", dateStart: "", dateEnd: "", link: "", imageUrl: "", imageFile: null, preview: null });
    setSaved(false);
  };

  return (
    <div className="affiche-section">
      <div className="affiche-intro">
        <h2 className="affiche-heading">Affiche à la une</h2>
        <p className="affiche-desc">
          Cette affiche s'affiche en grand sur la page d'accueil pour mettre un événement en valeur.
          Importez votre image d'affiche, ajoutez un titre et un lien facultatif.
        </p>
      </div>

      <div className="affiche-layout">
        {/* Form */}
        <div className="affiche-form">
          <label className="db-label">Titre de l'événement</label>
          <input
            className="db-input"
            placeholder="Ex : Event anniversaire 3 ans"
            value={form.title}
            onChange={(e) => { setF("title", e.target.value); setSaved(false); }}
          />

          <label className="db-label">Description courte</label>
          <textarea
            className="db-input"
            placeholder="Une description courte de l'événement…"
            rows={3}
            value={form.summary}
            onChange={(e) => { setF("summary", e.target.value); setSaved(false); }}
            style={{ resize: "vertical", minHeight: "72px" }}
          />

          <label className="db-label">Date de début (optionnel)</label>
          <input
            className="db-input"
            type="date"
            value={form.dateStart}
            onChange={(e) => { setF("dateStart", e.target.value); setSaved(false); }}
          />

          <label className="db-label">Date de fin (optionnel)</label>
          <input
            className="db-input"
            type="date"
            value={form.dateEnd}
            onChange={(e) => { setF("dateEnd", e.target.value); setSaved(false); }}
          />

          <label className="db-label">Lien (facultatif)</label>
          <input
            className="db-input"
            placeholder="https://… ou /evenements"
            value={form.link}
            onChange={(e) => { setF("link", e.target.value); setSaved(false); }}
          />

          <label className="db-label">Image de l'affiche</label>
          <div
            className="affiche-upload"
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {form.preview ? (
              <>
                <img src={form.preview} alt="Affiche" className="affiche-upload-img" />
                <div className="affiche-upload-change">Changer l'image</div>
              </>
            ) : (
              <div className="affiche-upload-empty">
                <span className="affiche-upload-icon">🖼</span>
                <span>Cliquez ou glissez l'affiche ici</span>
                <span className="affiche-upload-hint">PNG · JPG · WEBP</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {saveError && (
            <p className="affiche-save-error">✕ {saveError}</p>
          )}

          <div className="affiche-actions">
            <button
              className="db-btn db-btn--publish"
              onClick={handleSave}
              disabled={saving || (!form.preview && !form.imageUrl)}
            >
              {saving ? "Enregistrement…" : saved ? "✓ Affiché sur le site" : "Mettre en avant →"}
            </button>
            {affiche && (
              <button className="db-btn db-btn--cancel" onClick={handleClear}>
                Retirer l'affiche
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="affiche-preview-wrap">
          <p className="db-sidebar-label">Aperçu</p>
          <div className="affiche-preview">
            {form.preview ? (
              <img src={form.preview} alt="Aperçu affiche" className="affiche-preview-img" />
            ) : (
              <div className="affiche-preview-empty">
                <span>Aucune affiche</span>
              </div>
            )}
            {form.title && (
              <div className="affiche-preview-title">{form.title}</div>
            )}
          </div>
          {affiche && (
            <p className="affiche-status">
              ✦ Actuellement affichée depuis le {new Date(affiche.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            </p>
          )}
        </div>
      </div>
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
  const titleStack = getFontStack(form.titleFont || form.font);
  const bodyStack  = getFontStack(form.bodyFont  || form.font);
  const isFull = form.coverMode === "full";

  return (
    <div className="ap-card" style={{ background: form.bgColor }}>
      {form.coverPreview ? (
        <div className={`ap-cover${isFull ? " ap-cover--full" : ""}`}>
          <img src={form.coverPreview} alt="Couverture" style={{ objectFit: isFull ? "contain" : "cover" }} />
          {!isFull && <div className="ap-cover-overlay" />}
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

        <h3 className="ap-title" style={{ color: form.titleColor, fontFamily: titleStack }}>
          {form.title || <span className="ap-placeholder">Titre de l'article</span>}
        </h3>

        {form.summary && (
          <p className="ap-summary" style={{ color: form.textColor, fontFamily: bodyStack }}>{form.summary}</p>
        )}

        <div className="ap-content" style={{ borderColor: `${form.accentColor}33` }}>
          {form.content ? (
            <p style={{ color: form.textColor, fontFamily: bodyStack }}>
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

/* ── Membres ─────────────────────────────────────────────── */

function MembresSection() {
  const [members, setMembers] = useState(() => getAllMembers());
  const [search, setSearch] = useState("");

  useEffect(() => {
    const refresh = () => setMembers(getAllMembers());
    window.addEventListener("woltar:members", refresh);
    return () => window.removeEventListener("woltar:members", refresh);
  }, []);

  const filtered = members.filter(
    (m) =>
      m.pseudo.toLowerCase().includes(search.toLowerCase()) ||
      (m.woltarien1 || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.woltarien2 || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = (member, role) => {
    upsertMember({ ...member, role });
  };

  const handleDelete = (member) => {
    if (!window.confirm(`Supprimer le compte de ${member.pseudo} ?`)) return;
    deleteMember(member.id);
  };

  return (
    <div className="mbr-section">
      <div className="mbr-header">
        <div>
          <h2 className="mbr-heading">Membres inscrits</h2>
          <p className="mbr-desc">
            {members.length} compte{members.length !== 1 ? "s" : ""} enregistré{members.length !== 1 ? "s" : ""}.
            Gérez les rôles et accès des membres de la communauté.
          </p>
        </div>
        <input
          className="mbr-search"
          type="text"
          placeholder="Rechercher un membre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mbr-empty">
          {members.length === 0
            ? "Aucun membre inscrit pour l'instant."
            : "Aucun résultat pour cette recherche."}
        </div>
      ) : (
        <div className="mbr-list">
          {filtered.map((m) => (
            <div className="mbr-card" key={m.id}>
              <div className="mbr-card-left">
                <div className="mbr-avatar">
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.pseudo} className="mbr-avatar-img" />
                  ) : (
                    <span className="mbr-avatar-icon">👤</span>
                  )}
                </div>
                <div className="mbr-info">
                  <div className="mbr-pseudo">{m.pseudo}</div>
                  <div className="mbr-woltariens">
                    {m.woltarien1}
                    {m.woltarien2 && <span> · {m.woltarien2}</span>}
                  </div>
                  <div className="mbr-date">
                    Inscrit le {new Date(m.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </div>
                </div>
              </div>
              <div className="mbr-card-right">
                <select
                  className="mbr-role-select"
                  value={m.role || "membre"}
                  onChange={(e) => handleRoleChange(m, e.target.value)}
                >
                  {Object.entries(MEMBER_ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <button
                  className="mbr-delete-btn"
                  onClick={() => handleDelete(m)}
                  title="Supprimer ce compte"
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
