import { useState } from "react";
import "./style.css";

const sections = [
  { id: "accueil", label: "Accueil" },
  { id: "histoire", label: "Woltar et son histoire" },
  { id: "events", label: "Évènements" },
  { id: "formulaires", label: "Formulaires" },
  { id: "fanarts", label: "Fan-arts" },
  { id: "rp", label: "RP" },
  { id: "staff", label: "Staff" },
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

        <nav>
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>
      </header>

      <section id="accueil" className="hero">
        <div className="hero-content">
          <span className="tag">Event anniversaire — 3 ans</span>
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
        <p>
          Woltar est un univers virtuel communautaire où les joueurs adoptent,
          font évoluer et accompagnent leurs Woltariens dans leur vie sociale,
          familiale et professionnelle.
        </p>
      </Section>

      <Section id="events" title="Évènements">
        <div className="cards-grid">
          <Card title="Anniversaire des 3 ans" text="Event principal communautaire." />
          <Card title="Animations RP" text="Scènes, intrigues et défis narratifs." />
          <Card title="Concours" text="Créations, fan-arts et participations." />
        </div>
      </Section>

      <Section id="formulaires" title="Formulaire RP">
        <div className="form-box">
          <input placeholder="Pseudo du joueur in game" />
          <input placeholder="Prénom du woltarien participant" />
          <input placeholder="NOM du woltarien participant" />

          <h3>Répartition des caractéristiques</h3>
          <p className="hint">40 points à répartir — moyenne : 5 par compétence.</p>

          <div className="stats-grid">
            {stats.map((stat) => (
              <label key={stat}>
                <span>{stat}</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={values[stat]}
                  onChange={(e) => handleStat(stat, e.target.value)}
                />
              </label>
            ))}
          </div>

          <div className={remaining === 0 ? "points ok" : "points warning"}>
            Total : {total}/40 — Points restants : {remaining}
          </div>

          <button disabled={remaining !== 0}>
            Envoyer la fiche RP
          </button>
        </div>
      </Section>

      <Section id="fanarts" title="Fan-arts">
        <div className="cards-grid">
          <Card title="Galerie" text="Espace dédié aux créations des joueurs." />
          <Card title="Artistes" text="Mise en avant des membres créatifs." />
          <Card title="Règles" text="Formats, crédits et conditions de partage." />
        </div>
      </Section>

      <Section id="rp" title="RP">
        <p>
          Retrouvez ici les règles RP, les intrigues, les fiches personnages,
          les clans, les inscriptions et les annonces liées à l’évènement.
        </p>
      </Section>

      <Section id="staff" title="Staff">
        <div className="cards-grid">
          <Card title="Organisation" text="Gestion globale de l’évènement." />
          <Card title="Animation RP" text="Scénarios, personnages et narration." />
          <Card title="Modération" text="Cadre, respect et accompagnement." />
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

function Card({ title, text }) {
  return (
    <div className="info-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}