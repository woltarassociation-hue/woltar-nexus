import { useState, useEffect } from "react";
import "./style.css";

const sections = [
  { id: "accueil", label: "Accueil", icon: "🏠" },
  { id: "histoire", label: "Histoire", icon: "📖" },
  { id: "actualites", label: "Actualités", icon: "✦" },
  { id: "events", label: "Événements", icon: "🎪" },
  { id: "fanarts", label: "Fan-arts", icon: "🎨" },
  { id: "rp", label: "RP", icon: "🎭" },
  { id: "equipes", label: "Équipe", icon: "👥" },
];

const stats = [
  "Agilité",
  "Perception",
  "Chance",
  "Mémoire",
  "Intelligence",
  "Créativité",
  "Charisme",
  "Force",
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

export default function App() {
  const [values, setValues] = useState(
    Object.fromEntries(stats.map((stat) => [stat, 5]))
  );
  const [showFormRp, setShowFormRp] = useState(false);
  const [pseudoJoueur, setPseudoJoueur] = useState("");
  const [nomWoltarien, setNomWoltarien] = useState("");
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

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

  <nav className="nav-links">
    {sections.map((section) => (
      <a key={section.id} href={`#${section.id}`} className="nav-link">
        <span className="nav-symbol">{section.icon}</span>
        <span>{section.label}</span>
      </a>
    ))}
  </nav>
</header>

      <section id="accueil" className="hero">
        <div className="hero-content">
          <Carousel slides={newsSlides} currentIndex={currentNewsIndex} setCurrentIndex={setCurrentNewsIndex} />
        </div>

        <div className="hero-card">
          <h2>Bienvenue sur Woltar</h2>
          <p>
            Un système planétaire perdu dans l’espace, habité par les
            Woltariens, Woltariennes et Woltarions.
          </p>
        </div>
      </section>
<Section id="actualites" title="Actualités">
  <div className="cards-grid">
       <Card
      title="Actualités"
      text="Mises à jour, nouveautés et annonces générales."
      smallText="Mise à jour, nouveautés, etc..."
      onClick={() => setCurrentNewsIndex(1)}
      isClickable
    />
    <Card
      title="Prévention"
      text="Affiches, rappels et sensibilisation communautaire."
      onClick={() => setCurrentNewsIndex(2)}
      isClickable
    />

    <Card
      title="Règles"
      text="Droits d’auteur, cadre communautaire et règles de vie."
      onClick={() => setCurrentNewsIndex(3)}
      isClickable
    />
  </div>
</Section>
      <Section id="histoire" title="Woltar et son histoire">
        <div className="work-in-progress">
          <div className="work-in-progress-panel">
            <div className="work-in-progress-content">
              <div className="work-in-progress-title">⚠ Travaux en cours ⚠</div>
              <div className="work-in-progress-text">Cette section est actuellement en reconstruction.</div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="events" title="Événements">
        <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: "28px", padding: "32px", marginBottom: "40px" }}>
          <h3 style={{ color: "#004477", fontSize: "24px", marginTop: 0, marginBottom: "24px" }}>Event Officiel</h3>
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
          <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: "28px", padding: "40px", marginBottom: "40px" }}>
            <p style={{ fontStyle: "italic", marginBottom: "24px", color: "#666" }}>
              Seul les joueurs ayant un compte et un woltarien(ne)s adultes peuvent s'inscrire
            </p>

            <div>
              <label style={{ display: "block", fontWeight: "bold", color: "#8B0000", marginBottom: "8px", fontSize: "16px" }}>
                Pseudo du joueur in game
              </label>
              <input
                placeholder="Votre pseudo"
                value={pseudoJoueur}
                onChange={(e) => setPseudoJoueur(e.target.value)}
                style={{ width: "100%", padding: "12px", marginBottom: "24px", border: "2px solid #1fa8dc", borderRadius: "12px", fontSize: "15px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px", fontSize: "16px", color: "#004477" }}>
                Prénom et NOM du woltarien(ne) participant(e)
              </label>
              <input
                placeholder="Prénom et nom"
                value={nomWoltarien}
                onChange={(e) => setNomWoltarien(e.target.value)}
                style={{ width: "100%", padding: "12px", marginBottom: "24px", border: "2px solid #1fa8dc", borderRadius: "12px", fontSize: "15px" }}
              />
            </div>

            <h3 style={{ color: "#004477", marginBottom: "20px" }}>Répartition des points de caractéristiques (40 pts)</h3>
            <p style={{ fontSize: "14px", opacity: 0.75, marginBottom: "24px", color: "#666" }}>
              Min: 0 | Max: 10 par statistique | Total obligatoire: 40 points
            </p>

            <div className="stats-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {stats.map((stat) => (
                <div key={stat} style={{
                  background: "linear-gradient(135deg, #fff 0%, #f0f4ff 100%)",
                  border: "3px solid #004477",
                  borderRadius: "8px",
                  padding: "16px",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontWeight: "bold", color: "#004477", fontSize: "14px" }}>{stat}</span>
                    <span style={{ background: "#8B0000", color: "white", padding: "4px 10px", borderRadius: "4px", fontWeight: "bold", fontSize: "14px" }}>
                      {values[stat]}/10
                    </span>
                  </div>

                  <div style={{ background: "#1a1a2e", border: "2px solid #35b9ed", borderRadius: "6px", height: "20px", overflow: "hidden", marginBottom: "10px", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
                    <div style={{
                      background: `linear-gradient(90deg, #35b9ed 0%, #1fa8dc 50%, #0891b2 100%)`,
                      height: "100%",
                      width: `${(values[stat] / 10) * 100}%`,
                      transition: "width 0.15s ease",
                      boxShadow: "0 0 10px rgba(53,185,237,0.6)"
                    }} />
                  </div>

                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <button onClick={() => handleStat(stat, Math.max(0, values[stat] - 1))} style={{
                      background: "#8B0000",
                      color: "white",
                      border: "2px solid #600000",
                      borderRadius: "4px",
                      padding: "6px 12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.1s"
                    }} onMouseEnter={(e) => e.target.style.background = "#A00000"} onMouseLeave={(e) => e.target.style.background = "#8B0000"}>
                      −
                    </button>
                    <button onClick={() => handleStat(stat, Math.min(10, values[stat] + 1))} style={{
                      background: "#8B0000",
                      color: "white",
                      border: "2px solid #600000",
                      borderRadius: "4px",
                      padding: "6px 12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.1s"
                    }} onMouseEnter={(e) => e.target.style.background = "#A00000"} onMouseLeave={(e) => e.target.style.background = "#8B0000"}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "20px", padding: "16px", borderRadius: "12px", textAlign: "center", fontWeight: "bold", background: remaining === 0 ? "#ddffe8" : "#fff4d6", color: remaining === 0 ? "#087b35" : "#9a6100" }}>
              Total: {total}/40 — Points restants: {remaining}
            </div>

            <button
              disabled={remaining !== 0 || !pseudoJoueur.trim() || !nomWoltarien.trim()}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "20px",
                borderRadius: "999px",
                border: "none",
                background: remaining === 0 && pseudoJoueur.trim() && nomWoltarien.trim() ? "linear-gradient(90deg, #8B0000, #1fa8dc)" : "#ccc",
                color: "white",
                fontWeight: "bold",
                cursor: remaining === 0 && pseudoJoueur.trim() && nomWoltarien.trim() ? "pointer" : "not-allowed",
                fontSize: "16px"
              }}
            >
              Envoyez sa candidature
            </button>

            <button
              onClick={() => setShowFormRp(false)}
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "12px",
                borderRadius: "999px",
                border: "2px solid #1fa8dc",
                background: "transparent",
                color: "#1fa8dc",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Fermer
            </button>
          </div>
        )}

        <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: "28px", padding: "32px" }}>
          <h3 style={{ color: "#004477", fontSize: "24px", marginTop: 0, marginBottom: "24px" }}>Event Joueurs</h3>
          <div className="cards-grid">
            <Card title="Galerie" text="Espace dédié aux créations des joueurs." />
            <Card title="Annonces" text="Événements et activités communautaires." />
          </div>
        </div>
      </Section>

      <Section id="fanarts" title="Fan-arts">
        <div className="work-in-progress">
          <div className="work-in-progress-panel">
            <div className="work-in-progress-content">
              <div className="work-in-progress-title">⚠ Travaux en cours ⚠</div>
              <div className="work-in-progress-text">Cette section est actuellement en reconstruction.</div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="rp" title="RP">
        <div className="work-in-progress">
          <div className="work-in-progress-panel">
            <div className="work-in-progress-content">
              <div className="work-in-progress-title">⚠ Travaux en cours ⚠</div>
              <div className="work-in-progress-text">Cette section est actuellement en reconstruction.</div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="lowtar" title="Lowtar">
        <div className="work-in-progress">
          <div className="work-in-progress-panel">
            <div className="work-in-progress-content">
              <div className="work-in-progress-title">⚠ Travaux en cours ⚠</div>
              <div className="work-in-progress-text">Cette section est actuellement en reconstruction.</div>
            </div>
          </div>
        </div>
      </Section>

      <footer>
        <p>
          © Woltar.com 2000-2022 — Woltar.net 2023-2026. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="section">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Card({ title, text, onClick, isClickable }) {
  return (
    <div
      className="info-card"
      onClick={onClick}
      style={{
        cursor: isClickable ? "pointer" : "default",
        transition: isClickable ? "all 0.2s" : "none"
      }}
      onMouseEnter={(e) => isClickable && (e.currentTarget.style.transform = "translateY(-8px) scale(1.02)")}
      onMouseLeave={(e) => isClickable && (e.currentTarget.style.transform = "translateY(0) scale(1)")}
    >
      <h3>{title}</h3>
      <p>{text}</p>
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

        <button className="carousel-arrow carousel-arrow--left" onClick={prev} aria-label="Précédent">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M8 2L2 9L8 16" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="carousel-arrow carousel-arrow--right" onClick={next} aria-label="Suivant">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M2 2L8 9L2 16" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

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