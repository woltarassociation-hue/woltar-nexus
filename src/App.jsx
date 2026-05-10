import { useState } from "react";
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

export default function App() {
  const [values, setValues] = useState(
    Object.fromEntries(stats.map((stat) => [stat, 5]))
  );
  const [showFormRp, setShowFormRp] = useState(false);
  const [pseudoJoueur, setPseudoJoueur] = useState("");
  const [nomWoltarien, setNomWoltarien] = useState("");

  const total = Object.values(values).reduce((a, b) => a + Number(b), 0);
  const remaining = 40 - total;

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
          <span className="tag">Event Woltar 2026</span>
          <h1>Woltar.net Event Hub</h1>
          <p>
            Un espace communautaire pour célébrer Woltar.net, organiser les
            évènements RP, partager les fan-arts et réunir les joueurs autour
            de l’univers Woltar.
          </p>

          <div className="hero-actions">
            <a href="#formulaires" className="primary-btn">
              Participer à l’event
            </a>
            <a href="#histoire" className="secondary-btn">
              Découvrir Woltar
            </a>
          </div>
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

      <Section id="equipes" title="Équipes">
        <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: "28px", padding: "32px", marginBottom: "40px" }}>
          <h3 style={{ color: "#004477", fontSize: "24px", marginTop: 0, marginBottom: "24px" }}>Organisation</h3>
          <div className="cards-grid">
            <Card title="Présentation" text="Qui nous sommes et nos objectifs." />
            <Card title="Membres" text="L’équipe fondatrice de Woltar.net." />
            <Card title="Contact" text="Nous rejoindre ou nous contacter." />
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: "28px", padding: "32px", marginBottom: "40px" }}>
          <h3 style={{ color: "#004477", fontSize: "24px", marginTop: 0, marginBottom: "24px" }}>Association</h3>
          <div className="cards-grid">
            <Card title="Présentation" text="Qui nous sommes et nos objectifs." />
            <Card title="Membres" text="L’équipe fondatrice de Woltar.net." />
            <Card title="Contact" text="Nous rejoindre ou nous contacter." />
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: "28px", padding: "32px" }}>
          <h3 style={{ color: "#004477", fontSize: "24px", marginTop: 0, marginBottom: "24px" }}>Équipe Modération Discord</h3>
          <div className="cards-grid">
            <Card title="Modérateurs" text="L’équipe qui encadre les discussions." />
            <Card title="Règles Discord" text="Normes et bonnes pratiques." />
            <Card title="Support" text="Signaler un problème ou proposer une aide." />
          </div>
        </div>
      </Section>

      <footer>
        Woltar.net — Event Hub communautaire
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