import { useState, useEffect } from "react";
import "./style.css";

const sections = [
  { id: "accueil", label: "Accueil", icon: "/icn_accueil/accueil_icn.png" },
  { id: "histoire", label: "Woltar et son histoire", icon: "/icn_accueil/story_icn.png" },
  { id: "events", label: "Événements", icon: "/icn_accueil/event_icn.png" },
  { id: "fanarts", label: "Fan-arts", icon: "/icn_accueil/fanart_icn.png" },
  { id: "rp", label: "RP", icon: "/icn_accueil/rp_icn.png" },
  { id: "equipes", label: "Équipes", icon: "/icn_accueil/staff_icn.png" },
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

const newsArticles = [
  {
    id: 1,
    category: "Événements 2026",
    title: "Event anniversaire 3 ans",
    accroche: "Entrez dans l'arène !",
    text: "Évènement inédit pour l'approche des 3 ans de Woltar.net",
    image: "/Affiche_Entrez_dans_larene.png",
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
      setCurrentNewsIndex((prev) => (prev + 1) % newsArticles.length);
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
        <img src="/logo_woltar.png" alt="Woltar" className="nav-logo" />

       <nav className="nav-icons">
  {sections.map((section) => (
    <a key={section.id} href={`#${section.id}`} className="nav-item">
      <img src={section.icon} alt="" className="nav-icon" />
    </a>
  ))}
</nav>
      </header>

      <section id="accueil" className="hero">
        <div className="hero-content">
          <Carousel articles={newsArticles} currentIndex={currentNewsIndex} setCurrentIndex={setCurrentNewsIndex} />
        </div>

        <div className="hero-card">
          <h2>Bienvenue sur Woltar</h2>
          <p>
            Un système planétaire perdu dans l’espace, habité par les
            Woltariens, Woltariennes et Woltarions.
          </p>
        </div>
      </section>

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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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

function Carousel({ articles, currentIndex, setCurrentIndex }) {
  if (articles.length === 0) return null;
  const current = articles[currentIndex];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: "28px",
        }}
      >
        <div
          style={{
            display: "flex",
            transition: "opacity 0.8s ease-in-out",
            opacity: 1,
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              flex: "1 0 100%",
              backgroundImage: `url(${current.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
              borderRadius: "28px",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%)",
                borderRadius: "28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "40px",
                color: "white",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.3)",
                  color: "white",
                  fontWeight: "bold",
                  padding: "8px 16px",
                  borderRadius: "999px",
                  marginBottom: "16px",
                  width: "fit-content",
                  backdropFilter: "blur(8px)",
                }}
              >
                {current.category}
              </span>
              <h2
                style={{
                  fontSize: "clamp(28px, 5vw, 48px)",
                  fontWeight: "bold",
                  marginBottom: "12px",
                  textShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                {current.title}
              </h2>
              <p
                style={{
                  fontSize: "18px",
                  lineHeight: "1.6",
                  marginBottom: "16px",
                  textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                {current.text}
              </p>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "14px",
                  fontStyle: "italic",
                  opacity: 0.9,
                }}
              >
                {current.accroche}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginTop: "24px",
        }}
      >
        {articles.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              border: "2px solid white",
              background: idx === currentIndex ? "white" : "rgba(255,255,255,0.4)",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
            }}
          />
        ))}
      </div>
    </div>
  );
}