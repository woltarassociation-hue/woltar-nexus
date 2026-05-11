import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { getPublishedByCategories, getFontStack, estimateReadTime } from "../lib/articles";
import { getSubcategories } from "../lib/subcategories";
import CatPageNav from "../components/CatPageNav";

const ALL_CATS_DESC = [
  { id: "actualites", label: "Actualités",  icon: "✦",  desc: "Mises à jour, annonces et nouvelles" },
  { id: "evenements", label: "Événements",  icon: "🎪", desc: "Animations RP, concours, festivités" },
  { id: "fanarts",    label: "Fan-arts",    icon: "🎨", desc: "Créations artistiques de la communauté" },
  { id: "rp",         label: "RP",          icon: "🎭", desc: "Récits, intrigues et aventures" },
  { id: "prevention", label: "Prévention",  icon: "🛡", desc: "Sensibilisation et bonnes pratiques" },
  { id: "regles",     label: "Règles",      icon: "📋", desc: "Cadre communautaire et lignes directrices" },
];

const CATEGORY_CONFIG = {
  actualites: {
    label: "Actualités",
    icon: "✦",
    description: "Mises à jour, annonces et nouvelles de l'univers Woltar. Restez informés des derniers événements, changements et actualités de la communauté.",
    categories: ["actualites", "prevention", "regles"],
  },
  prevention: {
    label: "Prévention",
    icon: "🛡",
    description: "Sensibilisation, affiches et rappels importants pour la communauté Woltar. Protection des artistes, droits numériques et bonnes pratiques.",
    categories: ["prevention"],
  },
  regles: {
    label: "Règles",
    icon: "📋",
    description: "Cadre communautaire, droits d'auteur et lignes directrices de Woltar.net. Consultez les règles qui guident notre univers.",
    categories: ["regles"],
  },
  evenements: {
    label: "Événements",
    icon: "🎪",
    description: "Animations RP, concours, défis et festivités communautaires. Ne manquez aucun événement de l'univers Woltar.",
    categories: ["evenements"],
  },
  fanarts: {
    label: "Fan-arts",
    icon: "🎨",
    description: "Créations artistiques de la communauté Woltarienne. Fan-arts, illustrations et œuvres originales inspirées de l'univers Woltar.",
    categories: ["fanarts"],
  },
  rp: {
    label: "RP",
    icon: "🎭",
    description: "Récits, intrigues et aventures de l'univers Woltar. Plongez dans les histoires qui enrichissent le monde de Woltar.net.",
    categories: ["rp"],
  },
};

const CATEGORY_META = {
  actualites: { label: "Actualités",  icon: "✦" },
  prevention:  { label: "Prévention", icon: "🛡" },
  regles:      { label: "Règles",     icon: "📋" },
  evenements:  { label: "Événements", icon: "🎪" },
  fanarts:     { label: "Fan-arts",   icon: "🎨" },
  rp:          { label: "RP",         icon: "🎭" },
};

export default function CategoryPage() {
  const { category } = useParams();
  const config = CATEGORY_CONFIG[category];

  const [articles, setArticles] = useState(() =>
    config ? getPublishedByCategories(config.categories) : []
  );

  useEffect(() => {
    if (!config) return;
    const load = () => setArticles(getPublishedByCategories(config.categories));
    load();
    window.addEventListener("woltar:articles", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("woltar:articles", load);
      window.removeEventListener("storage", load);
    };
  }, [category]);

  if (!config) return <Navigate to="/" replace />;

  const featured = articles[0] || null;
  const rest = articles.slice(1);
  const subcats = getSubcategories(category);

  return (
    <div className="cat-page">
      <CatPageNav currentCategory={category} />

      {/* Hero */}
      <div className="cat-hero">
        <div className="cat-hero-inner">
          <div className="cat-hero-eyebrow">
            <span className="cat-hero-icon-big">{config.icon}</span>
          </div>
          <h1 className="cat-hero-title">{config.label}</h1>
          <p className="cat-hero-desc">{config.description}</p>
          <span className="cat-hero-count">
            {articles.length} article{articles.length !== 1 ? "s" : ""} publié{articles.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="cat-layout">
        <main className="cat-main">
          {subcats.length > 0 && (
            <div className="cat-subcat-bar">
              {subcats.map(sub => (
                <Link key={sub.id} to={`/${category}/${sub.id}`} className="cat-subcat-pill">
                  {sub.icon} {sub.label}
                </Link>
              ))}
            </div>
          )}
          {articles.length === 0 ? (
            <EmptyState config={config} currentCategory={category} />
          ) : (
            <div className="cat-content">
              {featured && (
                <div className="cat-featured-wrap">
                  <p className="cat-section-label">À la une</p>
                  <FeaturedCard article={featured} category={category} />
                </div>
              )}
              {rest.length > 0 && (
                <div className="cat-grid-section">
                  <p className="cat-section-label">Tous les articles</p>
                  <div className="cat-article-grid">
                    {rest.map((a) => (
                      <ArticleCard key={a.id} article={a} />
                    ))}
                  </div>
                </div>
              )}
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


/* ── État vide enrichi ───────────────────────────────────────── */

function EmptyState({ config, currentCategory }) {
  const others = ALL_CATS_DESC.filter((c) => c.id !== currentCategory).slice(0, 4);

  return (
    <div className="cat-empty-wrap">
      <div className="cat-empty">
        <span className="cat-empty-icon">{config.icon}</span>
        <h2 className="cat-empty-title">{config.label}</h2>
        <p className="cat-empty-text">
          Les articles de cette section apparaîtront ici une fois publiés par l'équipe Woltar.
        </p>
        <div className="cat-empty-badge">Bientôt disponible</div>
      </div>

      <div className="cat-empty-others">
        <p className="cat-section-label">Explorer d'autres sections</p>
        <div className="cat-empty-grid">
          {others.map((cat) => (
            <Link key={cat.id} to={`/${cat.id}`} className="cat-empty-card">
              <span className="cat-empty-card-icon">{cat.icon}</span>
              <span className="cat-empty-card-label">{cat.label}</span>
              <span className="cat-empty-card-desc">{cat.desc}</span>
              <span className="cat-empty-card-cta">Voir →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Featured article ───────────────────────────────────────── */

function FeaturedCard({ article, category }) {
  const navigate = useNavigate();
  const meta = CATEGORY_META[article.category] || { label: article.category, icon: "✦" };
  const fontStack = getFontStack(article.font);
  const readTime = estimateReadTime(article.content);

  return (
    <article
      className="cat-featured"
      onClick={() => navigate(`/${article.category}/${article.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/${article.category}/${article.slug}`)}
    >
      <div className="cat-featured-media">
        {article.coverUrl ? (
          <img src={article.coverUrl} alt={article.title} className="cat-featured-img" />
        ) : (
          <div className="cat-featured-placeholder">
            <span>{meta.icon}</span>
          </div>
        )}
        <div className="cat-featured-overlay" />
      </div>

      <div className="cat-featured-body">
        <div className="cat-featured-meta">
          <span className="cat-tag" style={{ color: article.accentColor || "#1fa8dc" }}>
            {meta.icon} {meta.label}
          </span>
        </div>
        <h2 className="cat-featured-title" style={{ fontFamily: fontStack, color: article.titleColor }}>
          {article.title}
        </h2>
        {article.summary && (
          <p className="cat-featured-summary" style={{ color: article.textColor }}>
            {article.summary}
          </p>
        )}
        <div className="cat-featured-footer">
          {article.author && (
            <span className="cat-meta-author">Par {article.author}</span>
          )}
          <span className="cat-meta-date">
            {new Date(article.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </span>
          <span className="cat-meta-read">{readTime} min de lecture</span>
          <span className="cat-read-more">Lire l'article →</span>
        </div>
      </div>
    </article>
  );
}

/* ── Article grid card ──────────────────────────────────────── */

function ArticleCard({ article }) {
  const navigate = useNavigate();
  const meta = CATEGORY_META[article.category] || { label: article.category, icon: "✦" };
  const fontStack = getFontStack(article.font);
  const readTime = estimateReadTime(article.content);

  return (
    <article
      className="cat-card"
      onClick={() => navigate(`/${article.category}/${article.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/${article.category}/${article.slug}`)}
      style={{ background: article.bgColor || "#fff" }}
    >
      {article.coverUrl && (
        <div className="cat-card-cover">
          <img src={article.coverUrl} alt={article.title} />
        </div>
      )}
      <div className="cat-card-body">
        <span className="cat-tag cat-tag--small" style={{ color: article.accentColor || "#1fa8dc" }}>
          {meta.icon} {meta.label}
        </span>
        <h3
          className="cat-card-title"
          style={{ fontFamily: fontStack, color: article.titleColor }}
        >
          {article.title}
        </h3>
        {article.summary && (
          <p className="cat-card-summary" style={{ color: article.textColor }}>
            {article.summary}
          </p>
        )}
        <div className="cat-card-footer">
          {article.author && (
            <span className="cat-meta-author">Par {article.author}</span>
          )}
          <span className="cat-meta-date">
            {new Date(article.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </span>
          <span className="cat-meta-read">{readTime} min</span>
        </div>
      </div>
    </article>
  );
}
