import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { getPublishedByCategories, getFontStack, estimateReadTime } from "../lib/articles";
import SiteNav from "../components/SiteNav";

const CATEGORY_CONFIG = {
  actualites: {
    label: "Actualités",
    icon: "✦",
    description:
      "Mises à jour, annonces et nouvelles de l'univers Woltar. Restez informés des derniers événements, changements et actualités de la communauté.",
    categories: ["actualites", "prevention", "regles"],
  },
  prevention: {
    label: "Prévention",
    icon: "🛡",
    description:
      "Sensibilisation, affiches et rappels importants pour la communauté Woltar. Protection des artistes, droits numériques et bonnes pratiques.",
    categories: ["prevention"],
  },
  regles: {
    label: "Règles",
    icon: "📋",
    description:
      "Cadre communautaire, droits d'auteur et lignes directrices de Woltar.net. Consultez les règles qui guident notre univers.",
    categories: ["regles"],
  },
  evenements: {
    label: "Événements",
    icon: "🎪",
    description:
      "Animations RP, concours, défis et festivités communautaires. Ne manquez aucun événement de l'univers Woltar.",
    categories: ["evenements"],
  },
  fanarts: {
    label: "Fan-arts",
    icon: "🎨",
    description:
      "Créations artistiques de la communauté Woltarienne. Fan-arts, illustrations et œuvres originales inspirées de l'univers Woltar.",
    categories: ["fanarts"],
  },
  rp: {
    label: "RP",
    icon: "🎭",
    description:
      "Récits, intrigues et aventures de l'univers Woltar. Plongez dans les histoires qui enrichissent le monde de Woltar.net.",
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

  return (
    <div className="cat-page">
      <div className="red-pattern" />

      <SiteNav />

      {/* Hero immersif */}
      <div className="cat-hero">
        <div className="cat-hero-inner">
          <Link to="/" className="cat-back">← Accueil</Link>
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

      {/* Contenu principal */}
      <main className="cat-main">
        {articles.length === 0 ? (
          <div className="cat-empty">
            <span className="cat-empty-icon">{config.icon}</span>
            <h2 className="cat-empty-title">Aucun article pour le moment</h2>
            <p className="cat-empty-text">
              Les articles de cette catégorie apparaîtront ici une fois publiés.
            </p>
            <Link to="/" className="cat-empty-btn">← Retour à l'accueil</Link>
          </div>
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

      <footer className="site-footer">
        <div className="site-footer-inner">
          <img src="/logo_woltar.png" alt="Woltar" className="footer-logo" />
          <p>© Woltar.com 2000–2022 — Woltar.net 2023–2026. Tous droits réservés.</p>
        </div>
      </footer>
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
