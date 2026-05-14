import { useState, useEffect, useMemo } from "react";
import { Routes, Route, useNavigate, useParams, Link } from "react-router-dom";
import AssociationDashboard from "./components/AssociationDashboard.jsx";
import SiteNav from "./components/SiteNav.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LocalStorageBanner from "./components/LocalStorageBanner.jsx";
import AnnouncementPopup from "./components/AnnouncementPopup.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import ArticlePage from "./pages/ArticlePage.jsx";
import SubCategoryPage from "./pages/SubCategoryPage.jsx";
import FormPage from "./pages/FormPage.jsx";
import SetupPage from "./pages/SetupPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import TicketsPage from "./pages/TicketsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PollsPage from "./pages/PollsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import { getPublishedByCategories, getFontStack } from "./lib/articles.js";
import { getSubcategories } from "./lib/subcategories.js";
import { seedDefaultProfiles } from "./lib/profiles.js";
import { getAffiche, loadAffiche } from "./lib/affiche.js";
import { getSettings, settingsReady } from "./lib/settings.js";
import { isConfigured as supabaseConfigured } from "./lib/db.js";

seedDefaultProfiles();
import "./style.css";

function stripHtml(html) {
  return (html || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

const CATEGORY_META = {
  actualites: { label: "Actualités",  icon: "✦" },
  prevention:  { label: "Prévention", icon: "🛡" },
  regles:      { label: "Règles",     icon: "📋" },
  evenements:  { label: "Événements", icon: "🎪" },
  fanarts:     { label: "Fan-arts",   icon: "🎨" },
  rp:          { label: "RP",         icon: "🎭" },
};

const PORTAL_CATEGORIES = [
  {
    href: "/actualites",
    icon: "✦",
    label: "Actualités",
    desc: "Mises à jour, prévention et règles communautaires.",
    accent: "#1fa8dc",
  },
  {
    href: "/evenements",
    icon: "🎪",
    label: "Événements",
    desc: "Animations RP, concours et festivités Woltar.",
    accent: "#e8912a",
  },
  {
    href: "/fanarts",
    icon: "🎨",
    label: "Fan-arts",
    desc: "Créations artistiques de la communauté.",
    accent: "#a865d8",
  },
  {
    href: "/rp",
    icon: "🎭",
    label: "RP",
    desc: "Récits, intrigues et aventures de l'univers.",
    accent: "#8b0000",
  },
];

/* ── Custom hook ──────────────────────────────────────────── */

function usePublishedArticles(categories) {
  const key = categories.join(",");
  const [articles, setArticles] = useState(() => getPublishedByCategories(categories));
  useEffect(() => {
    const cats = key.split(",");
    const refresh = () => setArticles(getPublishedByCategories(cats));
    window.addEventListener("woltar:articles", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("woltar:articles", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [key]);
  return articles;
}

/* ── Smart routing: article OR subcategory ────────────────── */

function ArticleOrSubcat() {
  const { category, slug } = useParams();
  const subcats = getSubcategories(category);
  if (subcats.some((s) => s.id === slug)) {
    return <SubCategoryPage />;
  }
  return <ArticlePage />;
}

/* ── Router ───────────────────────────────────────────────── */

export default function App() {
  return (
    <>
      <AnnouncementPopup />
      <LocalStorageBanner />
      {!supabaseConfigured && import.meta.env.DEV && <SupabaseMissingBanner />}
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/compte" element={<AccountPage />} />
        <Route path="/sondages" element={<PollsPage />} />
        <Route
          path="/association/dashboard"
          element={
            <ProtectedRoute requirePermission="access_dashboard">
              <AssociationDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/profil/:username" element={<ProfilePage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/formulaire/:formId" element={<FormPage />} />
        <Route path="/:category/:slug" element={<ArticleOrSubcat />} />
        <Route path="/:category" element={<CategoryPage />} />
      </Routes>
    </>
  );
}

/* ── Bannière dev : Supabase non configuré ────────────────── */

function SupabaseMissingBanner() {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 99999,
      background: "#7c1a1a", color: "#fff", fontSize: 13,
      padding: "10px 20px", display: "flex", alignItems: "center", gap: 12,
      fontFamily: "monospace", borderBottom: "2px solid #ff4444",
    }}>
      <span style={{ fontWeight: 700, color: "#ff9999" }}>⚠ DEV</span>
      <span>
        Supabase non configuré — remplissez{" "}
        <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>
          VITE_SUPABASE_URL
        </code>{" "}
        et{" "}
        <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>
          VITE_SUPABASE_ANON_KEY
        </code>{" "}
        dans <strong>.env.local</strong>, puis relancez Vite.
      </span>
    </div>
  );
}

/* ── Page d'accueil ───────────────────────────────────────── */

function MainSite() {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  const [settings, setSettings] = useState(() => getSettings());
  useEffect(() => {
    settingsReady.then(() => setSettings(getSettings()));
    const refresh = () => setSettings(getSettings());
    window.addEventListener("woltar:settings", refresh);
    return () => window.removeEventListener("woltar:settings", refresh);
  }, []);

  const [affiche, setAffiche] = useState(() => getAffiche());
  useEffect(() => {
    loadAffiche();
    const reload = () => setAffiche(getAffiche());
    window.addEventListener("woltar:affiche", reload);
    return () => window.removeEventListener("woltar:affiche", reload);
  }, []);

  const allPublishedArticles = usePublishedArticles(Object.keys(CATEGORY_META));
  const newsSlides = useMemo(() => {
    if (allPublishedArticles.length === 0) return [];
    const sorted = [...allPublishedArticles].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    return sorted.slice(0, 3).map((a) => ({
      category: CATEGORY_META[a.category]?.label || a.category,
      subcategory: a.author || "",
      title: a.title,
      text: a.summary || stripHtml(a.content).slice(0, 180),
      image: a.coverUrl || "/logo_woltar.png",
      href: `/${a.category}/${a.slug}`,
    }));
  }, [allPublishedArticles]);

  useEffect(() => {
    if (newsSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % newsSlides.length);
    }, 20000);
    return () => clearInterval(timer);
  }, [newsSlides.length]);

  if (settings.maintenance_mode) {
    return (
      <div className="maintenance-page">
        <div className="maintenance-inner">
          <span className="maintenance-icon">🔧</span>
          <h1 className="maintenance-title">{settings.site_name || "Woltar.net"}</h1>
          <p className="maintenance-msg">
            {settings.maintenance_message || "Le site est temporairement en maintenance. Revenez bientôt !"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="site">

      <SiteNav />

      {/* ── Hero compact ── */}
      <section id="accueil" className="hero">
        <div className="hero-welcome">
          <h1 className="hero-welcome-title">
            {settings.hero_title || "Bienvenue sur Woltar"}
          </h1>
          <p className="hero-welcome-sub">
            {settings.hero_subtitle || "Un système planétaire perdu dans l'espace, habité par les Woltariens, Woltariennes et Woltarions."}
          </p>
          <div className="hero-cta-row">
            <Link
              to={settings.cta_primary?.href || "/actualites"}
              className="hero-cta-btn hero-cta-btn--primary"
            >
              {settings.cta_primary?.label || "Entrer dans l'univers"}
            </Link>
            <Link
              to={settings.cta_secondary?.href || "/evenements"}
              className="hero-cta-btn hero-cta-btn--secondary"
            >
              {settings.cta_secondary?.label || "Découvrir les événements"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Corps principal bleu (layout_corps Woltar.net) ── */}
      <div className="corps">

        {/* ── Événement à la une ── */}
        <EventSpotlight affiche={affiche} articles={allPublishedArticles} />

        {/* ── Carousel Band ── */}
        <CarouselBand
          slides={newsSlides}
          currentIndex={currentNewsIndex}
          setCurrentIndex={setCurrentNewsIndex}
        />

        {/* ── Derniers articles (grille éditoriale) ── */}
        <LatestArticlesGrid articles={allPublishedArticles} />

        {/* ── Portail catégories ── */}
        <CategoriesPortal />

        {/* ── Association ── */}
        <Section id="association" title="Espace membres">
          <div className="association-access">
            <div className="association-access-panel">
              <div className="association-access-icon">◇</div>
              <div className="association-access-title">Accès membres</div>
              <p className="association-access-desc">
                Connectez-vous pour accéder à votre espace et à vos outils selon votre rôle dans la communauté.
              </p>
              <Link to="/login" className="association-login-btn">
                Se connecter →
              </Link>
              <Link to="/inscription" className="assoc-register-link">
                S'enregistrer
              </Link>
            </div>
          </div>
        </Section>

      </div>{/* ── /corps ── */}

      <footer>
        <p>© Woltar.com 2000–2022 — Woltar.net 2023–2026. Tous droits réservés.</p>
      </footer>
    </div>
  );
}

/* ── Événement à la une ───────────────────────────────────── */

function EventSpotlight({ affiche, articles }) {
  const navigate = useNavigate();

  if (affiche?.imageUrl) {
    return (
      <div className="event-spotlight">
        <div className="event-spotlight-inner">
          <div className="event-spotlight-img-wrap">
            <img
              src={affiche.imageUrl}
              alt={affiche.title || "Événement"}
              className="event-spotlight-img"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
          <div className="event-spotlight-body">
            <span className="event-spotlight-label">🎪 Événement à la une</span>
            {affiche.title && <h2 className="event-spotlight-title">{affiche.title}</h2>}
            {affiche.summary && <p className="event-spotlight-summary">{affiche.summary}</p>}
            {(affiche.dateStart || affiche.dateEnd) && (
              <div className="event-spotlight-dates">
                {affiche.dateStart && (
                  <span>Du {new Date(affiche.dateStart).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span>
                )}
                {affiche.dateEnd && (
                  <span> au {new Date(affiche.dateEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span>
                )}
              </div>
            )}
            {affiche.link && (
              <a href={affiche.link} className="event-spotlight-cta">Voir l'événement →</a>
            )}
          </div>
        </div>
      </div>
    );
  }

  const latest = articles
    .filter((a) => a.category === "evenements")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;

  if (latest) {
    const href = `/${latest.category}/${latest.slug}`;
    const fontStack = getFontStack(latest.font);
    return (
      <div className="event-spotlight">
        <div
          className="event-spotlight-inner event-spotlight-inner--article"
          onClick={() => navigate(href)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(href)}
        >
          <div className="event-spotlight-img-wrap">
            {latest.coverUrl ? (
              <img
                src={latest.coverUrl}
                alt={latest.title}
                className="event-spotlight-img"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="event-spotlight-img-fallback">🎪</div>
            )}
          </div>
          <div className="event-spotlight-body">
            <span className="event-spotlight-label">🎪 Événement à la une</span>
            <h2
              className="event-spotlight-title"
              style={{ fontFamily: fontStack, color: latest.titleColor || undefined }}
            >
              {latest.title}
            </h2>
            {latest.summary && (
              <p className="event-spotlight-summary" style={{ color: latest.textColor || undefined }}>
                {latest.summary}
              </p>
            )}
            <span className="event-spotlight-date">
              {new Date(latest.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
            <span className="event-spotlight-cta">Voir l'événement →</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ── Carousel Band — section standalone ──────────────────── */

function CarouselBand({ slides, currentIndex, setCurrentIndex }) {
  return (
    <section className="carousel-band">
      <div className="carousel-band-eyebrow">
        <span>✦ À la une</span>
      </div>
      <div className="carousel-band-track">
        {slides.length > 0 ? (
          <Carousel slides={slides} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />
        ) : (
          <div className="carousel-band-empty">
            <span className="carousel-band-empty-icon">✦</span>
            <p>Les articles à la une apparaîtront ici.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Latest Articles Grid — grille éditoriale ────────────── */

function LatestArticlesGrid({ articles }) {
  const latest = useMemo(() => {
    return [...articles]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 7);
  }, [articles]);

  if (latest.length === 0) return null;

  const [featured, ...rest] = latest;

  return (
    <section className="section lag-section">
      <div className="lag-header">
        <h2>Derniers articles</h2>
        <Link to="/actualites" className="lag-see-all">Tout voir →</Link>
      </div>
      <div className="lag-grid">
        <LatestFeaturedCard article={featured} />
        <div className="lag-small-grid">
          {rest.slice(0, 6).map((a) => (
            <LatestSmallCard key={a.id} article={a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LatestFeaturedCard({ article }) {
  const navigate = useNavigate();
  const meta = CATEGORY_META[article.category] || { label: article.category, icon: "✦" };
  const fontStack = getFontStack(article.font);
  const href = `/${article.category}/${article.slug}`;

  return (
    <article
      className="lag-featured"
      onClick={() => navigate(href)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(href)}
    >
      <div className="lag-featured-img">
        {article.coverUrl ? (
          <img src={article.coverUrl} alt={article.title} />
        ) : (
          <div className="lag-featured-fallback">{meta.icon}</div>
        )}
        <div className="lag-featured-overlay" />
      </div>
      <div className="lag-featured-body">
        <span className="lag-featured-cat" style={{ color: article.accentColor || "#1fa8dc" }}>
          {meta.icon} {meta.label}
        </span>
        <h3 className="lag-featured-title" style={{ fontFamily: fontStack }}>
          {article.title}
        </h3>
        {article.summary && (
          <p className="lag-featured-summary">{article.summary}</p>
        )}
        <div className="lag-featured-foot">
          <span className="lag-featured-date">
            {new Date(article.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </span>
          <span className="lag-featured-read">Lire →</span>
        </div>
      </div>
    </article>
  );
}

function LatestSmallCard({ article }) {
  const navigate = useNavigate();
  const meta = CATEGORY_META[article.category] || { label: article.category, icon: "✦" };
  const href = `/${article.category}/${article.slug}`;

  return (
    <article
      className="lag-small"
      onClick={() => navigate(href)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(href)}
    >
      {article.coverUrl && (
        <div className="lag-small-thumb">
          <img src={article.coverUrl} alt={article.title} />
        </div>
      )}
      <div className="lag-small-body">
        <span className="lag-small-cat" style={{ color: article.accentColor || "#1fa8dc" }}>
          {meta.icon} {meta.label}
        </span>
        <h4 className="lag-small-title">{article.title}</h4>
        <span className="lag-small-date">
          {new Date(article.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        </span>
      </div>
    </article>
  );
}

/* ── Portail catégories ───────────────────────────────────── */

function CategoriesPortal() {
  return (
    <section className="portal-section">
      <div className="portal-inner">
        <div className="portal-header">
          <h2 className="portal-title">Explorez l'univers Woltar</h2>
          <p className="portal-sub">Plongez dans les différentes facettes de la communauté</p>
        </div>
        <div className="portal-grid">
          {PORTAL_CATEGORIES.map((cat) => (
            <a
              key={cat.href}
              href={cat.href}
              className="portal-card"
              style={{ "--card-accent": cat.accent }}
            >
              <span className="portal-card-icon">{cat.icon}</span>
              <div className="portal-card-body">
                <span className="portal-card-label">{cat.label}</span>
                <p className="portal-card-desc">{cat.desc}</p>
              </div>
              <span className="portal-card-arrow">→</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Composants partagés ──────────────────────────────────── */

function Section({ id, title, children }) {
  return (
    <section id={id} className="section">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Carousel({ slides, currentIndex, setCurrentIndex }) {
  const navigate = useNavigate();
  if (!slides || slides.length === 0) return null;
  const prev = () => setCurrentIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setCurrentIndex((i) => (i + 1) % slides.length);

  return (
    <div className="carousel">
      <div className="carousel-track">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`carousel-slide${idx === currentIndex ? " carousel-slide--active" : ""}${slide.href ? " carousel-slide--link" : ""}`}
            onClick={slide.href ? () => navigate(slide.href) : undefined}
            role={slide.href ? "button" : undefined}
            tabIndex={slide.href ? 0 : undefined}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="carousel-img"
              onError={(e) => { e.target.src = "/logo_woltar.png"; }}
            />
            <div className="carousel-overlay" />
            <div className="carousel-content">
              <div className="carousel-badges">
                <span className="carousel-tag">{slide.category}</span>
                {slide.subcategory && (
                  <span className="carousel-subtag">/ {slide.subcategory}</span>
                )}
              </div>
              <h2 className="carousel-title">{slide.title}</h2>
              <p className="carousel-body">{slide.text}</p>
              {slide.href && <span className="carousel-read-btn">Lire l'article →</span>}
            </div>
          </div>
        ))}

        <button className="carousel-arrow carousel-arrow--left" onClick={prev} aria-label="Précédent">‹</button>
        <button className="carousel-arrow carousel-arrow--right" onClick={next} aria-label="Suivant">›</button>

        {slides.length > 1 && (
          <div className="carousel-dots">
            {slides.map((_, idx) => (
              <button
                key={idx}
                className={`carousel-dot${idx === currentIndex ? " carousel-dot--active" : ""}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
