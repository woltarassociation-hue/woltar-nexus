import { useState, useEffect, useMemo } from "react";
import { Routes, Route, useNavigate, useParams, Link } from "react-router-dom";
import AssociationDashboard from "./components/AssociationDashboard.jsx";
import SiteNav from "./components/SiteNav.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import ArticlePage from "./pages/ArticlePage.jsx";
import SubCategoryPage from "./pages/SubCategoryPage.jsx";
import SetupPage from "./pages/SetupPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import { getPublishedByCategories, getFontStack, estimateReadTime } from "./lib/articles.js";
import { getSubcategories } from "./lib/subcategories.js";
import { saveCandidature } from "./lib/candidatures.js";
import { authenticate, setSession, seedDefaultProfiles } from "./lib/profiles.js";

seedDefaultProfiles();
import "./style.css";

const stats = [
  "Agilité", "Perception", "Chance", "Mémoire",
  "Intelligence", "Créativité", "Charisme", "Force",
];

const CAROUSEL_CATS = ["actualites", "evenements", "prevention", "regles"];

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

const HOME_CATEGORIES = [
  {
    href: "/actualites",
    icon: "✦",
    label: "Actualités",
    desc: "Mises à jour, prévention et règles communautaires.",
  },
  {
    href: "/evenements",
    icon: "🎪",
    label: "Événements",
    desc: "Animations RP, concours et festivités Woltar.",
  },
  {
    href: "/fanarts",
    icon: "🎨",
    label: "Fan-arts",
    desc: "Créations artistiques de la communauté.",
  },
  {
    href: "/rp",
    icon: "🎭",
    label: "RP",
    desc: "Récits, intrigues et aventures de l'univers.",
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
    <Routes>
      <Route path="/" element={<MainSite />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/inscription" element={<RegisterPage />} />
      <Route path="/compte" element={<AccountPage />} />
      <Route path="/association/dashboard" element={<AssociationDashboard />} />
      <Route path="/:category/:slug" element={<ArticleOrSubcat />} />
      <Route path="/:category" element={<CategoryPage />} />
    </Routes>
  );
}

/* ── Page d'accueil ───────────────────────────────────────── */

function MainSite() {
  const navigate = useNavigate();
  const [values, setValues] = useState(
    Object.fromEntries(stats.map((stat) => [stat, 5]))
  );
  const [showFormRp, setShowFormRp] = useState(false);
  const [pseudoJoueur, setPseudoJoueur] = useState("");
  const [nomWoltarien, setNomWoltarien] = useState("");
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [rpSubmitted, setRpSubmitted] = useState(false);
  const [assocUser, setAssocUser] = useState("");
  const [assocPass, setAssocPass] = useState("");
  const [assocError, setAssocError] = useState(false);

  const [affiche, setAffiche] = useState(() => {
    try { return JSON.parse(localStorage.getItem("woltar_affiche") || "null"); } catch { return null; }
  });
  useEffect(() => {
    const reload = () => {
      try { setAffiche(JSON.parse(localStorage.getItem("woltar_affiche") || "null")); } catch { setAffiche(null); }
    };
    window.addEventListener("woltar:affiche", reload);
    return () => window.removeEventListener("woltar:affiche", reload);
  }, []);

  // Carousel : 3 derniers articles publiés, triés par date décroissante
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

  const total = Object.values(values).reduce((a, b) => a + Number(b), 0);
  const remaining = 40 - total;

  useEffect(() => {
    if (newsSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % newsSlides.length);
    }, 20000);
    return () => clearInterval(timer);
  }, [newsSlides.length]);

  const handleStat = (stat, value) => {
    const clean = Math.max(0, Math.min(10, Number(value)));
    setValues({ ...values, [stat]: clean });
  };

  return (
    <div className="site">


      <SiteNav />

      {/* ── Hero ── */}
      <section id="accueil" className="hero">
        <div className="hero-welcome">
          <h1 className="hero-welcome-title">Bienvenue sur Woltar</h1>
          <p className="hero-welcome-sub">
            Un système planétaire perdu dans l'espace, habité par les
            Woltariens, Woltariennes et Woltarions.
          </p>
          <div className="hero-welcome-cats">
            {HOME_CATEGORIES.map((c) => (
              <a key={c.href} href={c.href} className="hero-cat-pill">
                {c.icon} {c.label}
              </a>
            ))}
          </div>
        </div>

        {newsSlides.length > 0 && (
          <div className="hero-content">
            <Carousel
              slides={newsSlides}
              currentIndex={currentNewsIndex}
              setCurrentIndex={setCurrentNewsIndex}
            />
          </div>
        )}
      </section>

      {/* ── Événement à la une (toujours visible) ── */}
      <EventSpotlight affiche={affiche} articles={allPublishedArticles} />

      {/* ── Catégories en vedette ── */}
      <section className="section home-categories-section">
        <h2>Explorez l'univers Woltar</h2>
        <div className="home-cat-grid">
          {HOME_CATEGORIES.map((cat) => (
            <a key={cat.href} href={cat.href} className="home-cat-card">
              <span className="home-cat-icon">{cat.icon}</span>
              <span className="home-cat-label">{cat.label}</span>
              <span className="home-cat-desc">{cat.desc}</span>
              <span className="home-cat-cta">Voir les articles →</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Derniers articles (strip horizontal) ── */}
      <LatestArticlesStrip articles={allPublishedArticles} />

      {/* ── Histoire ── */}
      <Section id="histoire" title="Woltar et son histoire">
        <WorkInProgress />
      </Section>

      {/* ── Événements ── */}
      <Section id="events" title="Événements">
        <div className="event-box">
          <h3 className="event-box-title">Événement officiel</h3>
          <div className="cards-grid">
            <Card title="Animations RP" text="Scènes, intrigues et défis narratifs." />
            <Card title="Concours" text="Créations, fan-arts et participations." />
            <Card
              title="Formulaire RP 2026"
              text="Participez à l'événement Woltar 2026."
              onClick={() => setShowFormRp(!showFormRp)}
              isClickable
            />
          </div>
        </div>

        {showFormRp && (
          <div className="form-rp-box">
            <p className="form-rp-disclaimer">
              Seuls les joueurs possédant un compte et un(e) woltarien(ne) adulte peuvent s'inscrire.
            </p>

            <label className="form-label form-label--cyan">Pseudo du joueur en jeu</label>
            <input
              className="form-input"
              placeholder="Votre pseudo"
              value={pseudoJoueur}
              onChange={(e) => setPseudoJoueur(e.target.value)}
            />

            <label className="form-label form-label--light">Prénom et NOM du/de la woltarien(ne) participant(e)</label>
            <input
              className="form-input"
              placeholder="Prénom et nom"
              value={nomWoltarien}
              onChange={(e) => setNomWoltarien(e.target.value)}
            />

            <h3 className="form-stats-title">Répartition des caractéristiques (40 pts)</h3>
            <p className="form-stats-hint">Min : 0 | Max : 10 par statistique | Total obligatoire : 40 points</p>

            <div className="stats-form-grid">
              {stats.map((stat) => (
                <div key={stat} className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-card-name">{stat}</span>
                    <span className="stat-card-value">{values[stat]}/10</span>
                  </div>
                  <div className="stat-bar-bg">
                    <div className="stat-bar-fill" style={{ width: `${(values[stat] / 10) * 100}%` }} />
                  </div>
                  <div className="stat-card-controls">
                    <button className="stat-btn" onClick={() => handleStat(stat, values[stat] - 1)}>−</button>
                    <button className="stat-btn" onClick={() => handleStat(stat, values[stat] + 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className={`form-points${remaining === 0 ? " form-points--ok" : " form-points--warn"}`}>
              Total : {total}/40 — Points restants : {remaining}
            </div>

            {rpSubmitted ? (
              <div className="form-submitted-msg">
                ✓ Candidature envoyée avec succès ! L'équipe Woltar vous contactera prochainement.
              </div>
            ) : (
              <button
                disabled={remaining !== 0 || !pseudoJoueur.trim() || !nomWoltarien.trim()}
                className="form-submit-btn"
                onClick={() => {
                  saveCandidature({ pseudo: pseudoJoueur, nomWoltarien, stats: values });
                  setRpSubmitted(true);
                  setPseudoJoueur("");
                  setNomWoltarien("");
                  setValues(Object.fromEntries(stats.map((s) => [s, 5])));
                }}
              >
                Envoyer la candidature
              </button>
            )}

            <button onClick={() => { setShowFormRp(false); setRpSubmitted(false); }} className="form-close-btn">
              Fermer
            </button>
          </div>
        )}

        <div className="event-box">
          <h3 className="event-box-title">Événements joueurs</h3>
          <div className="cards-grid">
            <Card title="Galerie" text="Espace dédié aux créations des joueurs." />
            <Card title="Annonces" text="Événements et activités communautaires." />
          </div>
        </div>

        <div className="section-see-more">
          <a href="/evenements" className="section-see-more-btn">
            Voir tous les articles Événements →
          </a>
        </div>
      </Section>

      {/* ── Équipe ── */}
      <Section id="equipes" title="L'équipe Woltar">
        <WorkInProgress />
      </Section>

      {/* ── Association ── */}
      <Section id="association" title="Espace association">
        <div className="association-access">
          <div className="association-access-panel">
            <div className="association-access-icon">◇</div>
            <div className="association-access-title">Accès membres</div>
            <form
              className="association-login-form"
              onSubmit={(e) => {
                e.preventDefault();
                const profile = authenticate(assocUser, assocPass);
                if (profile) {
                  setSession(profile);
                  navigate("/association/dashboard");
                } else {
                  setAssocError(true);
                  setAssocPass("");
                }
              }}
            >
              <div className="assoc-field">
                <label className="assoc-label">Identifiant</label>
                <input
                  className="assoc-input"
                  type="text"
                  autoComplete="username"
                  value={assocUser}
                  onChange={(e) => { setAssocUser(e.target.value); setAssocError(false); }}
                  placeholder="Votre identifiant"
                />
              </div>
              <div className="assoc-field">
                <label className="assoc-label">Mot de passe</label>
                <input
                  className="assoc-input"
                  type="password"
                  autoComplete="current-password"
                  value={assocPass}
                  onChange={(e) => { setAssocPass(e.target.value); setAssocError(false); }}
                  placeholder="••••••••"
                />
              </div>
              {assocError && (
                <p className="assoc-error">Identifiants incorrects.</p>
              )}
              <button type="submit" className="association-login-btn">
                Ouvrir le tableau de bord →
              </button>
            </form>
            <Link to="/inscription" className="assoc-register-link">
              S'enregistrer
            </Link>
          </div>
        </div>
      </Section>

      <footer>
        <p>© Woltar.com 2000–2022 — Woltar.net 2023–2026. Tous droits réservés.</p>
      </footer>
    </div>
  );
}

/* ── Événement à la une — toujours visible ───────────────── */

function EventSpotlight({ affiche, articles }) {
  const navigate = useNavigate();

  // Priorité 1 : affiche manuelle avec image
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
            <span className="event-spotlight-label">Événement à la une</span>
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

  // Priorité 2 : dernier article publié de la catégorie "evenements"
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
            <span className="event-spotlight-label">Événement à la une</span>
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

  // Priorité 3 : rectangle blanc placeholder (toujours présent)
  return (
    <div className="event-spotlight">
      <div className="event-spotlight-inner event-spotlight-inner--empty">
        <div className="event-spotlight-placeholder">
          <span className="event-spotlight-placeholder-icon">🎪</span>
          <p className="event-spotlight-placeholder-title">Événement à la une</p>
          <p className="event-spotlight-placeholder-sub">Bientôt disponible</p>
        </div>
      </div>
    </div>
  );
}

/* ── Strip horizontal — derniers articles publiés ────────── */

function LatestArticlesStrip({ articles }) {
  const latest = useMemo(() => {
    return [...articles]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
  }, [articles]);

  return (
    <section className="section latest-strip-section">
      <div className="latest-strip-header">
        <h2>Derniers articles publiés</h2>
        <Link to="/actualites" className="latest-strip-all">Voir tout →</Link>
      </div>

      {latest.length === 0 ? (
        <div className="latest-strip-empty">
          <span>✦</span>
          <p>Les articles apparaîtront ici une fois publiés.</p>
        </div>
      ) : (
        <div className="latest-strip-track">
          {latest.map((article) => (
            <LatestMiniCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
}

function LatestMiniCard({ article }) {
  const navigate = useNavigate();
  const meta = CATEGORY_META[article.category] || { label: article.category, icon: "✦" };
  const fontStack = getFontStack(article.font);

  return (
    <article
      className="latest-card"
      onClick={() => navigate(`/${article.category}/${article.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/${article.category}/${article.slug}`)}
    >
      <div className="latest-card-thumb">
        {article.coverUrl ? (
          <img src={article.coverUrl} alt={article.title} />
        ) : (
          <div className="latest-card-thumb-fallback">{meta.icon}</div>
        )}
      </div>
      <div className="latest-card-body">
        <span className="latest-card-cat" style={{ color: article.accentColor || "#1fa8dc" }}>
          {meta.icon} {meta.label}
        </span>
        <h3
          className="latest-card-title"
          style={{ fontFamily: fontStack, color: article.titleColor || "#1a1020" }}
        >
          {article.title}
        </h3>
        <div className="latest-card-footer">
          <span className="latest-card-date">
            {new Date(article.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "short",
            })}
          </span>
          <span className="latest-card-read">Lire →</span>
        </div>
      </div>
    </article>
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

function WorkInProgress() {
  return (
    <div className="work-in-progress">
      <div className="work-in-progress-panel">
        <div className="wip-glow-red" />
        <div className="wip-glow-blue" />
        <div className="wip-grid-lines" />
        <div className="work-in-progress-content">
          <span className="work-in-progress-icon">⚙</span>
          <div className="work-in-progress-title">Travaux en cours</div>
          <div className="work-in-progress-text">
            Cette section est en cours de construction.<br />
            L'univers Woltar continue d'évoluer.
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, text, onClick, isClickable }) {
  return (
    <div
      className="info-card"
      onClick={onClick}
      style={{ cursor: isClickable ? "pointer" : "default" }}
    >
      <h3>{title}</h3>
      <p>{text}</p>
      {isClickable && <span className="info-card-cta">Voir →</span>}
    </div>
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
