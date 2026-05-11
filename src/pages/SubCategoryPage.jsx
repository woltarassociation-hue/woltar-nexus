import { useState, useEffect, useRef } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { getAllArticles, getFontStack, estimateReadTime } from "../lib/articles";
import { getSubcategoryMeta, getSubcategories } from "../lib/subcategories";
import SiteNav from "../components/SiteNav";

const CATEGORY_META = {
  actualites: { label: "Actualités", icon: "✦", path: "/actualites" },
  prevention:  { label: "Prévention", icon: "🛡", path: "/prevention" },
  regles:      { label: "Règles", icon: "📋", path: "/regles" },
  evenements:  { label: "Événements", icon: "🎪", path: "/evenements" },
  fanarts:     { label: "Fan-arts", icon: "🎨", path: "/fanarts" },
  rp:          { label: "RP", icon: "🎭", path: "/rp" },
};

const ALL_CATS = [
  { id: "actualites", label: "Actualités", icon: "✦" },
  { id: "evenements", label: "Événements", icon: "🎪" },
  { id: "fanarts",    label: "Fan-arts",   icon: "🎨" },
  { id: "rp",         label: "RP",         icon: "🎭" },
  { id: "prevention", label: "Prévention", icon: "🛡" },
  { id: "regles",     label: "Règles",     icon: "📋" },
];

export default function SubCategoryPage() {
  const { category, slug: subcategoryId } = useParams();
  const catMeta = CATEGORY_META[category];
  const subMeta = getSubcategoryMeta(category, subcategoryId);

  const [articles, setArticles] = useState(() =>
    getAllArticles().filter(
      (a) => a.status === "published" && a.category === category && a.subcategory === subcategoryId
    )
  );

  useEffect(() => {
    if (!subMeta) return;
    const load = () => setArticles(
      getAllArticles().filter(
        (a) => a.status === "published" && a.category === category && a.subcategory === subcategoryId
      )
    );
    load();
    window.addEventListener("woltar:articles", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("woltar:articles", load);
      window.removeEventListener("storage", load);
    };
  }, [category, subcategoryId, subMeta]);

  if (!catMeta || !subMeta) return <Navigate to={catMeta ? `/${category}` : "/"} replace />;

  const subcats = getSubcategories(category);

  return (
    <div className="cat-page">

      <SiteNav />

      <div className="cat-hero">
        <div className="cat-hero-inner">
          <nav className="art-breadcrumb" style={{ marginBottom: "20px" }}>
            <Link to="/" className="art-breadcrumb-link">Accueil</Link>
            <span className="art-breadcrumb-sep">›</span>
            <Link to={`/${category}`} className="art-breadcrumb-link">{catMeta.icon} {catMeta.label}</Link>
            <span className="art-breadcrumb-sep">›</span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{subMeta.label}</span>
          </nav>
          <div className="cat-hero-eyebrow">
            <span className="cat-hero-icon-big">{subMeta.icon}</span>
          </div>
          <h1 className="cat-hero-title">{subMeta.label}</h1>
          <p className="cat-hero-desc">{catMeta.label} · {subMeta.label}</p>
          <span className="cat-hero-count">
            {articles.length} article{articles.length !== 1 ? "s" : ""} publié{articles.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="cat-layout">
        <CategoryNav currentCategory={category} />
        <main className="cat-main">
          {subcats.length > 0 && (
            <div className="cat-subcat-bar">
              {subcats.map((sub) => (
                <Link
                  key={sub.id}
                  to={`/${category}/${sub.id}`}
                  className={`cat-subcat-pill${sub.id === subcategoryId ? " cat-subcat-pill--active" : ""}`}
                >
                  {sub.icon} {sub.label}
                </Link>
              ))}
            </div>
          )}

          {articles.length === 0 ? (
            <div className="cat-empty">
              <span className="cat-empty-icon">{subMeta.icon}</span>
              <h2 className="cat-empty-title">{subMeta.label}</h2>
              <p className="cat-empty-text">Aucun article dans cette sous-catégorie pour le moment.</p>
              <Link to={`/${category}`} className="cat-empty-btn">← Retour à {catMeta.label}</Link>
            </div>
          ) : (
            <div className="cat-content">
              <div className="cat-grid-section">
                <div className="cat-article-grid">
                  {articles.map((a) => (
                    <SubArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <img src="/logo_woltar.png" alt="Woltar" className="footer-logo" />
          <p>© Woltar.com 2000–2022 — Woltar.net 2023–2026. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

function SubArticleCard({ article }) {
  const navigate = useNavigate();
  const fontStack = getFontStack(article.font);
  const readTime = estimateReadTime(article.content);
  const meta = CATEGORY_META[article.category] || { label: article.category, icon: "✦" };

  return (
    <article
      className="cat-card"
      onClick={() => navigate(`/${article.category}/${article.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/${article.category}/${article.slug}`)}
      style={{ background: article.bgColor || "#fff", cursor: "pointer" }}
    >
      {article.coverUrl && (
        <div className="cat-card-cover">
          <img src={article.coverUrl} alt={article.title} />
        </div>
      )}
      <div className="cat-card-body">
        <h3 className="cat-card-title" style={{ fontFamily: fontStack, color: article.titleColor }}>
          {article.title}
        </h3>
        {article.summary && (
          <p className="cat-card-summary" style={{ color: article.textColor }}>
            {article.summary}
          </p>
        )}
        <div className="cat-card-footer">
          {article.author && <span className="cat-meta-author">Par {article.author}</span>}
          <span className="cat-meta-date">
            {new Date(article.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span className="cat-meta-read">{readTime} min</span>
        </div>
      </div>
    </article>
  );
}

function CategoryNav({ currentCategory }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = ALL_CATS.find((c) => c.id === currentCategory);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <aside className="catnav-aside" ref={ref}>
      <button className={`catnav-toggle${open ? " catnav-toggle--open" : ""}`} onClick={() => setOpen(v => !v)}>
        <span className="catnav-toggle-icon">{current?.icon || "◈"}</span>
        <span className="catnav-toggle-label">{current?.label || "Sections"}</span>
        <span className="catnav-toggle-arrow">{open ? "▴" : "▾"}</span>
      </button>
      <div className={`catnav-panel${open ? " catnav-panel--open" : ""}`}>
        <p className="catnav-panel-header">Explorer les sections</p>
        {ALL_CATS.map((cat) => (
          <Link
            key={cat.id}
            to={`/${cat.id}`}
            className={`catnav-item${cat.id === currentCategory ? " catnav-item--active" : ""}`}
            onClick={() => setOpen(false)}
          >
            <span className="catnav-item-icon">{cat.icon}</span>
            <span className="catnav-item-label">{cat.label}</span>
            {cat.id === currentCategory && <span className="catnav-item-dot">◆</span>}
          </Link>
        ))}
        <Link to="/" className="catnav-home-link" onClick={() => setOpen(false)}>
          🏠 Retour à l'accueil
        </Link>
      </div>
    </aside>
  );
}
