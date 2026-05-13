import { useState, useEffect } from "react";
import { fetchDashboardStats } from "../../lib/stats.js";

function StatCard({ icon, value, label, variant = "" }) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__value">{value ?? "—"}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}

export default function StatsSection() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetchDashboardStats().then((data) => {
      if (data) setStats(data);
      else setError("Impossible de charger les statistiques.");
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="adm-empty">Chargement des statistiques…</div>;
  if (error)   return <div className="adm-empty" style={{ color: "#ff6060" }}>{error}</div>;

  return (
    <div>
      <h2 className="adm-section-title">Vue d'ensemble</h2>

      <div className="stats-grid">
        <StatCard icon="📝" value={stats.articles.published} label="Articles publiés"   variant="cyan"   />
        <StatCard icon="📋" value={stats.articles.draft}     label="Brouillons"         variant=""       />
        <StatCard icon="👥" value={stats.members.total}      label="Membres"            variant="green"  />
        <StatCard icon="✨" value={stats.members.newThisMonth} label="Nouveaux ce mois" variant="green"  />
        <StatCard icon="🎫" value={stats.tickets.open}       label="Tickets ouverts"   variant="red"    />
        <StatCard icon="📊" value={stats.polls.active}       label="Sondages actifs"   variant="purple" />
        <StatCard icon="🗳️" value={stats.polls.totalVotes}   label="Votes total"       variant="purple" />
        <StatCard icon="🎪" value={stats.events.active}      label="Événements"        variant="gold"   />
      </div>

      <div className="stats-section-title">Articles</div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <StatCard icon="📄" value={stats.articles.total}     label="Total"             />
        <StatCard icon="✅" value={stats.articles.published} label="Publiés" variant="green" />
        <StatCard icon="✏️" value={stats.articles.draft}     label="Brouillons"        />
      </div>

      <div className="stats-section-title">Tickets support</div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <StatCard icon="📩" value={stats.tickets.total} label="Total"        />
        <StatCard icon="🔴" value={stats.tickets.open}  label="Ouverts" variant="red" />
      </div>

      <div className="stats-section-title">Communauté</div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <StatCard icon="👥" value={stats.members.total}        label="Membres"           variant="green" />
        <StatCard icon="🆕" value={stats.members.newThisMonth} label="Nouveaux (30j)"   variant="green" />
        <StatCard icon="📊" value={stats.polls.active}         label="Sondages actifs"  variant="purple" />
        <StatCard icon="🗳️" value={stats.polls.totalVotes}     label="Votes total"      variant="purple" />
      </div>

      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 20, textAlign: "right" }}>
        Dernière mise à jour : {new Date().toLocaleTimeString("fr-FR")}
      </p>
    </div>
  );
}
