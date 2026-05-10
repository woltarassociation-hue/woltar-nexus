import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import AssociationDashboard from "./components/AssociationDashboard.jsx";
import { getPublishedByCategories, getFontStack } from "./lib/articles.js";
import "./style.css";

const sections = [
  { id: "accueil",    label: "Accueil",    icon: "🏠" },
  { id: "histoire",   label: "Histoire",   icon: "📖" },
  { id: "actualites", label: "Actualités", icon: "✦" },
  { id: "events",     label: "Événements", icon: "🎪" },
  { id: "fanarts",    label: "Fan-arts",   icon: "🎨" },
  { id: "rp",         label: "RP",         icon: "🎭" },
  { id: "equipes",    label: "Équipe",     icon: "👥" },
];

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
    text: "Cette affiche de prévention rappelle que l'utilisation de l'intelligence artificielle possède un impact réel sur les artistes, leurs œuvres et l'économie créative. Woltar.net encourage une utilisation responsable, transparente et respectueuse des créateurs.",
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

/* ── Custom hook ─────────────────────────────────────────── */

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

/* ── Router ──────────────────────────────────────────────── */

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainSite />} />
      <Route path="/association/dashboard" element={<AssociationDashboard />} />
    </Routes>
  );
}

/* ── Main site ───────────────────────────────────────────── */

function MainSite() {
  const navigate = useNavigate();
  const [values, setValues] = useState(
    Object.fromEntries(stats.map((stat) => [stat, 5]))
  );
  const [showFormRp, setShowFormRp] = useState(false);
  const [pseudoJoueur, setPseudoJoueur] = useState("");
  const [nomWoltarien, setNomWoltarien] = useState("");
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

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

      <header className="navbar">
        <a href="#accueil" className="nav-brand">
          <img src="/logo_woltar.png" alt="Woltar" className="nav-logo" />
        </a>

        <button
          className={`nav-hamburger${navOpen ? " is-open" : ""}`}
          onClick={() => setNavOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={navOpen}
        >
          <span /><span /><span />
        </button>

        <nav className={`nav-links${navOpen ? " is-open" : ""}`}>
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="nav-link"
              onClick={() => setNavOpen(false)}
            >
              <span className="nav-symbol">{section.icon}</span>
              <span>{section.label}</span>
            </a>
          ))}
          <a
            href="#association"
            className="nav-link nav-link--association"
            onClick={() => setNavOpen(false)}
          >
            <span className="nav-symbol">◇</span>
            <span>Association</span>
          </a>
        </nav>
      </header>

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
        </div>
      </section>

      <Section id="actualites" title="Actualités">
        <div className="cards-grid">
          <Card title="Actualités" text="Mises à jour, nouveautés et annonces générales." onClick={() => setCurrentNewsIndex(1)} isClickable />
          <Card title="Prévention" text="Affiches, rappels et sensibilisation communautaire." onClick={() => setCurrentNewsIndex(2)} isClickable />
          <Card title="Règles" text="Droits d'auteur, cadre communautaire et règles de vie." onClick={() => setCurrentNewsIndex(3)} isClickable />
        </div>
        <PublishedArticleList categories={["actualites", "prevention", "regles"]} />
      </Section>

      <Section id="histoire" title="Woltar et son histoire">
        <WorkInProgress />
      </Section>

      <Section id="events" title="Événements">
        <div className="event-box">
          <h3 className="event-box-title">Event Officiel</h3>
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
              Seuls les joueurs ayant un compte et un woltarien(ne) adulte peuvent s'inscrire.
            </p>

            <label className="form-label form-label--cyan">Pseudo du joueur in game</label>
            <input className="form-input" placeholder="Votre pseudo" value={pseudoJoueur} onChange={(e) => setPseudoJoueur(e.target.value)} />

            <label className="form-label form-label--light">Prénom et NOM du woltarien(ne) participant(e)</label>
            <input className="form-input" placeholder="Prénom et nom" value={nomWoltarien} onChange={(e) => setNomWoltarien(e.target.value)} />

            <h3 className="form-stats-title">Répartition des points de caractéristiques (40 pts)</h3>
            <p className="form-stats-hint">Min: 0 | Max: 10 par statistique | Total obligatoire: 40 points</p>

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
              Total: {total}/40 — Points restants: {remaining}
            </div>

            <button disabled={remaining !== 0 || !pseudoJoueur.trim() || !nomWoltarien.trim()} className="form-submit-btn">
              Envoyez sa candidature
            </button>

            <button onClick={() => setShowFormRp(false)} className="form-close-btn">
              Fermer
            </button>
          </div>
        )}

        <div className="event-box">
          <h3 className="event-box-title">Event Joueurs</h3>
          <div className="cards-grid">
            <Card title="Galerie" text="Espace dédié aux créations des joueurs." />
            <Card title="Annonces" text="Événements et activités communautaires." />
          </div>
        </div>

        <PublishedArticleList categories={["evenements"]} />
      </Section>

      <Section id="fanarts" title="Fan-arts">
        <WorkInProgress />
        <PublishedArticleList categories={["fanarts"]} />
      </Section>

      <Section id="rp" title="RP">
        <WorkInProgress />
        <PublishedArticleList categories={["rp"]} />
      </Section>

      <Section id="lowtar" title="Lowtar">
        <WorkInProgress />
      </Section>

      <Section id="association" title="Espace association">
        <div className="association-access">
          <div className="association-access-panel">
            <div className="association-access-icon">◇</div>
            <div className="association-access-title">Espace réservé</div>
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
        <p>© Woltar.com 2000-2022 — Woltar.net 2023-2026. Tous droits réservés.</p>
      </footer>
    </div>
  );
}

/* ── Published article display ───────────────────────────── */

function PublishedArticleList({ categories }) {
  const articles = usePublishedArticles(categories);
  if (articles.length === 0) return null;
  return (
    <div className="pub-list">
      <h3 className="pub-list-heading">Articles publiés</h3>
      <div className="pub-list-grid">
        {articles.map((article) => (
          <PublicArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}

function PublicArticleCard({ article }) {
  const [expanded, setExpanded] = useState(false);
  const fontStack = getFontStack(article.font);
  const meta = CATEGORY_META[article.category] || { label: article.category, icon: "✦" };

  return (
    <article
      className="pub-card"
      style={{ background: article.bgColor || "white", fontFamily: fontStack }}
    >
      {article.coverUrl && (
        <div className="pub-card-cover">
          <img src={article.coverUrl} alt={article.title} />
        </div>
      )}
      <div className="pub-card-body">
        <span className="pub-card-cat" style={{ color: article.accentColor || "#1fa8dc" }}>
          {meta.icon} {meta.label}
        </span>
        <h3 className="pub-card-title" style={{ color: article.titleColor, fontFamily: fontStack }}>
          {article.title}
        </h3>
        {article.summary && (
          <p className="pub-card-summary" style={{ color: article.textColor }}>
            {article.summary}
          </p>
        )}
        {expanded && article.content && (
          <div className="pub-card-content" style={{ color: article.textColor }}>
            {article.content.split("\n").map((line, i) =>
              line.trim() ? <p key={i}>{line}</p> : null
            )}
          </div>
        )}
        <div className="pub-card-footer">
          <button
            className="pub-card-toggle"
            style={{ color: article.accentColor || "#1fa8dc" }}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Réduire ↑" : "Lire la suite →"}
          </button>
          <span className="pub-card-date">
            {new Date(article.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ── Shared components ───────────────────────────────────── */

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
          <div key={idx} className={`carousel-slide${idx === currentIndex ? " carousel-slide--active" : ""}`}>
            <img src={slide.image} alt={slide.title} className="carousel-img" />
            <div className="carousel-overlay" />
            <div className="carousel-content">
              <div className="carousel-badges">
                <span className="carousel-tag">{slide.category}</span>
                {slide.subcategory && <span className="carousel-subtag">/ {slide.subcategory}</span>}
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
