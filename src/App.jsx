import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import AssociationDashboard from "./components/AssociationDashboard.jsx";
import SiteNav from "./components/SiteNav.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import ArticlePage from "./pages/ArticlePage.jsx";
import { getPublishedByCategories, getFontStack, estimateReadTime } from "./lib/articles.js";
import "./style.css";

const stats = [
  "Agilité", "Perception", "Chance", "Mémoire",
  "Intelligence", "Créativité", "Charisme", "Force",
];

const newsSlides = [
  {
    category: "Événements 2026",
    subcategory: "Animations RP",
    title: "Event anniversaire 3 ans",
    text: "Entrez dans l'arène ! À l'approche des 3 ans de Woltar.net, un événement inédit se prépare. Défis RP, animations communautaires et surprises seront au rendez-vous pour célébrer l'univers Woltar.",
    image: "/affiche_entrez_dans_larene.png",
  },
  {
    category: "Événements 2026",
    subcategory: "Animations RP",
    title: "Animations RP à venir",
    text: "Les prochaines animations RP communautaires arrivent bientôt. Préparez vos personnages, alliances et intrigues pour les futurs événements Woltar.",
    image: "/logo_woltar.png",
  },
  {
    category: "Actualités",
    subcategory: "Prévention",
    title: "L'IA n'est pas neutre",
    text: "Cette affiche de prévention rappelle que l'utilisation de l'intelligence artificielle a un impact réel sur les artistes, leurs œuvres et l'économie créative. Woltar.net encourage une utilisation responsable, transparente et respectueuse des créateurs.",
    image: "/affiche_prevention_1.png",
  },
  {
    category: "Actualités",
    subcategory: "Règles",
    title: "L'IA n'efface pas les droits d'auteur",
    text: "Les règles de Woltar.net rappellent l'importance du respect des artistes et de leurs créations. Plagiat, imitation abusive et utilisation non autorisée d'œuvres sont interdits au sein de la communauté.",
    image: "/affiche_regles_1.png",
  },
];

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

/* ── Router ───────────────────────────────────────────────── */

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainSite />} />
      <Route path="/association/dashboard" element={<AssociationDashboard />} />
      <Route path="/:category/:slug" element={<ArticlePage />} />
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

  const allCategories = Object.keys(CATEGORY_META);
  const recentArticles = usePublishedArticles(allCategories).slice(0, 4);

  const total = Object.values(values).reduce((a, b) => a + Number(b), 0);
  const remaining = 40 - total;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % newsSlides.length);
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  const handleStat = (stat, value) => {
    const clean = Math.max(0, Math.min(10, Number(value)));
    setValues({ ...values, [stat]: clean });
  };

  return (
    <div className="site">
      <div className="red-pattern" />

      <SiteNav />

      {/* ── Hero ── */}
      <section id="accueil" className="hero">
        <div className="hero-content">
          <Carousel
            slides={newsSlides}
            currentIndex={currentNewsIndex}
            setCurrentIndex={setCurrentNewsIndex}
          />
        </div>
        <div className="hero-card">
          <h2>Bienvenue sur Woltar</h2>
          <p>
            Un système planétaire perdu dans l'espace, habité par les
            Woltariens, Woltariennes et Woltarions.
          </p>
          <div className="hero-card-cats">
            {HOME_CATEGORIES.map((c) => (
              <a key={c.href} href={c.href} className="hero-cat-pill">
                {c.icon} {c.label}
              </a>
            ))}
          </div>
        </div>
      </section>

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

      {/* ── Articles récents ── */}
      {recentArticles.length > 0 && (
        <section className="section recent-articles-section">
          <h2>Derniers articles</h2>
          <div className="recent-grid">
            {recentArticles.map((article) => (
              <RecentArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

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

            <button
              disabled={remaining !== 0 || !pseudoJoueur.trim() || !nomWoltarien.trim()}
              className="form-submit-btn"
            >
              Envoyer la candidature
            </button>

            <button onClick={() => setShowFormRp(false)} className="form-close-btn">
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
            <div className="association-access-title">Studio de publication</div>
            <p className="association-access-text">
              Accédez au studio de création pour rédiger, mettre en forme et
              publier les articles de l'association Woltar.
            </p>
            <button
              className="association-login-btn"
              onClick={() => navigate("/association/dashboard")}
            >
              Ouvrir le studio →
            </button>
          </div>
        </div>
      </Section>

      <footer>
        <p>© Woltar.com 2000–2022 — Woltar.net 2023–2026. Tous droits réservés.</p>
      </footer>
    </div>
  );
}

/* ── Recent article card (home page) ─────────────────────── */

function RecentArticleCard({ article }) {
  const navigate = useNavigate();
  const meta = CATEGORY_META[article.category] || { label: article.category, icon: "✦" };
  const fontStack = getFontStack(article.font);
  const readTime = estimateReadTime(article.content);

  return (
    <article
      className="recent-card"
      onClick={() => navigate(`/${article.category}/${article.slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/${article.category}/${article.slug}`)}
    >
      {article.coverUrl && (
        <div className="recent-card-cover">
          <img src={article.coverUrl} alt={article.title} />
        </div>
      )}
      <div className="recent-card-body">
        <span className="recent-card-cat" style={{ color: article.accentColor || "#1fa8dc" }}>
          {meta.icon} {meta.label}
        </span>
        <h3
          className="recent-card-title"
          style={{ fontFamily: fontStack, color: article.titleColor }}
        >
          {article.title}
        </h3>
        {article.summary && (
          <p className="recent-card-summary" style={{ color: article.textColor }}>
            {article.summary}
          </p>
        )}
        <div className="recent-card-footer">
          <span className="recent-card-date">
            {new Date(article.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </span>
          <span className="recent-card-read">{readTime} min</span>
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
        <div className="work-in-progress-content">
          <div className="work-in-progress-title">⚠ Travaux en cours ⚠</div>
          <div className="work-in-progress-text">
            Cette section est actuellement en reconstruction.
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
  if (!slides || slides.length === 0) return null;
  const prev = () => setCurrentIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setCurrentIndex((i) => (i + 1) % slides.length);

  return (
    <div className="carousel">
      <div className="carousel-track">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`carousel-slide${idx === currentIndex ? " carousel-slide--active" : ""}`}
          >
            <img src={slide.image} alt={slide.title} className="carousel-img" />
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
