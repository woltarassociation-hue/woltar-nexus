import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { getArticleBySlug, getFontStack, estimateReadTime } from "../lib/articles";
import SiteNav from "../components/SiteNav";

const CATEGORY_META = {
  actualites: { label: "Actualités",  icon: "✦",  path: "/actualites" },
  prevention:  { label: "Prévention", icon: "🛡",  path: "/prevention" },
  regles:      { label: "Règles",     icon: "📋",  path: "/regles" },
  evenements:  { label: "Événements", icon: "🎪",  path: "/evenements" },
  fanarts:     { label: "Fan-arts",   icon: "🎨",  path: "/fanarts" },
  rp:          { label: "RP",         icon: "🎭",  path: "/rp" },
};

export default function ArticlePage() {
  const { category, slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const found = getArticleBySlug(category, slug);
    setArticle(found);
    setLoading(false);
    window.scrollTo(0, 0);
  }, [category, slug]);

  useEffect(() => {
    const refresh = () => {
      const found = getArticleBySlug(category, slug);
      setArticle(found);
    };
    window.addEventListener("woltar:articles", refresh);
    return () => window.removeEventListener("woltar:articles", refresh);
  }, [category, slug]);

  if (loading) {
    return (
      <div className="art-loading">
        <div className="red-pattern" />
        <span>Chargement…</span>
      </div>
    );
  }

  if (!article) {
    const fallback = CATEGORY_META[category];
    return <Navigate to={fallback ? fallback.path : "/"} replace />;
  }

  const meta = CATEGORY_META[category] || { label: category, icon: "✦", path: "/" };
  const titleStack = getFontStack(article.titleFont || article.font);
  const bodyStack  = getFontStack(article.bodyFont  || article.font);
  const readTime = estimateReadTime(article.content);
  const hasHtml = /<[a-z][\s\S]*>/i.test(article.content || "");
  const isFull = article.coverMode === "full";

  return (
    <div
      className="art-page"
      style={{ "--art-accent": article.accentColor || "#1fa8dc" }}
    >
      <div className="red-pattern" />
      <SiteNav />

      {/* Hero — bannière recadrée OU header compact selon coverMode */}
      <div className={`art-hero${isFull ? " art-hero--compact" : ""}`}>
        {!isFull && (
          <div className="art-hero-cover">
            {article.coverUrl ? (
              <img src={article.coverUrl} alt={article.title} className="art-hero-img" />
            ) : (
              <div className="art-hero-cover-empty">
                <div className="art-hero-cover-pattern" />
              </div>
            )}
            <div className="art-hero-overlay" />
          </div>
        )}

        <div className="art-hero-content">
          <nav className="art-breadcrumb">
            <Link to="/" className="art-breadcrumb-link">Accueil</Link>
            <span className="art-breadcrumb-sep">›</span>
            <Link to={meta.path} className="art-breadcrumb-link">
              {meta.icon} {meta.label}
            </Link>
          </nav>

          <h1 className="art-hero-title" style={{ fontFamily: titleStack }}>
            {article.title}
          </h1>

          <div className="art-hero-meta">
            {article.author && (
              <span className="art-meta-item">
                <span className="art-meta-icon">✍</span>
                {article.author}
              </span>
            )}
            <span className="art-meta-item">
              <span className="art-meta-icon">📅</span>
              {new Date(article.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
            <span className="art-meta-item">
              <span className="art-meta-icon">⏱</span>
              {readTime} min de lecture
            </span>
          </div>
        </div>
      </div>

      {/* Image complète (mode A4) — affichée en pleine largeur sous le header */}
      {isFull && article.coverUrl && (
        <div className="art-cover-full">
          <img src={article.coverUrl} alt={article.title} className="art-cover-full-img" />
        </div>
      )}

      {/* Corps de l'article */}
      <div className="art-body">
        <div className="art-container">
          {article.summary && (
            <div
              className="art-intro"
              style={{ borderColor: article.accentColor || "#1fa8dc" }}
            >
              <p style={{ fontFamily: bodyStack, color: article.textColor }}>
                {article.summary}
              </p>
            </div>
          )}

          <div
            className="art-text"
            style={{ fontFamily: bodyStack, color: article.textColor || "#1a1020" }}
          >
            {hasHtml ? (
              <div
                className="art-rte-content"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              (article.content || "").split("\n").filter((l) => l.trim()).map((para, i) => (
                <p key={i} className="art-paragraph">{para}</p>
              ))
            )}
          </div>

          <div className="art-footer-nav">
            <Link to={meta.path} className="art-back-btn">
              ← Retour à {meta.label}
            </Link>
          </div>
        </div>
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
