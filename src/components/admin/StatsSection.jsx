import { useState, useEffect, useRef } from "react";
import { fetchDashboardStats } from "../../lib/stats.js";

// ── Compteur animé ─────────────────────────────────────────────
function useAnimatedCount(target, duration = 800) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (target == null) return;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

// ── KpiCard ────────────────────────────────────────────────────
function KpiCard({ icon, value, label, color, max }) {
  const animated = useAnimatedCount(value ?? 0);
  const pct = max && value != null ? Math.round((value / max) * 100) : null;

  return (
    <div className="rpx-card" style={{ "--rpx-color": color }}>
      <div className="rpx-card__icon">{icon}</div>
      <div className="rpx-card__value">{animated ?? "—"}</div>
      <div className="rpx-card__label">{label}</div>
      {pct != null && (
        <div className="rpx-card__bar">
          <div className="rpx-card__bar-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────
export default function StatsSection() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [refreshed, setRefreshed] = useState(new Date());

  const load = () => {
    setLoading(true);
    setError(null);
    fetchDashboardStats().then((data) => {
      if (data) { setStats(data); setRefreshed(new Date()); }
      else setError("Impossible de charger les statistiques.");
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="rpx-panel">
      <div className="rpx-empty">Chargement des statistiques…</div>
    </div>
  );

  if (error) return (
    <div className="rpx-panel">
      <div className="rpx-empty rpx-empty--error">{error}</div>
    </div>
  );

  return (
    <div className="rpx-panel">
      {/* Header */}
      <div className="rpx-panel-header">
        <h2 className="rpx-page-title">◈ STATISTIQUES</h2>
        <button className="rpx-refresh-btn" onClick={load} title="Actualiser">↻</button>
      </div>

      {/* KPI PRINCIPAUX */}
      <div className="rpx-section-title">KPI PRINCIPAUX</div>
      <div className="rpx-cards-grid">
        <KpiCard icon="📝" value={stats.articles.published} label="Articles publiés"    color="#1fa8dc" max={stats.articles.total} />
        <KpiCard icon="✏️" value={stats.articles.draft}     label="Brouillons"          color="#8b8b8b" />
        <KpiCard icon="👥" value={stats.members.total}      label="Membres total"       color="#2ecc71" />
        <KpiCard icon="✨" value={stats.members.newThisMonth} label="Nouveaux membres"  color="#27ae60" />
        <KpiCard icon="🎫" value={stats.tickets.open}       label="Tickets ouverts"     color="#e74c3c" max={stats.tickets.total} />
        <KpiCard icon="📋" value={stats.tickets.total}      label="Tickets total"       color="#c0392b" />
        <KpiCard icon="📊" value={stats.polls.active}       label="Sondages actifs"     color="#a865d8" />
        <KpiCard icon="🗳️" value={stats.polls.totalVotes}   label="Votes total"         color="#8e44ad" />
      </div>

      {/* ARTICLES */}
      <div className="rpx-section-title">ARTICLES</div>
      <div className="rpx-cards-grid rpx-cards-grid--sm">
        <KpiCard icon="📄" value={stats.articles.total}     label="Total"              color="#1fa8dc" />
        <KpiCard icon="✅" value={stats.articles.published} label="Publiés"            color="#2ecc71" max={stats.articles.total} />
        <KpiCard icon="✏️" value={stats.articles.draft}     label="Brouillons"         color="#8b8b8b" />
      </div>

      {/* TICKETS SUPPORT */}
      <div className="rpx-section-title">TICKETS SUPPORT</div>
      <div className="rpx-cards-grid rpx-cards-grid--sm">
        <KpiCard icon="📩" value={stats.tickets.total} label="Total"                   color="#e67e22" />
        <KpiCard icon="🔴" value={stats.tickets.open}  label="Ouverts"                 color="#e74c3c" max={stats.tickets.total} />
      </div>

      {/* COMMUNAUTÉ */}
      <div className="rpx-section-title">COMMUNAUTÉ</div>
      <div className="rpx-cards-grid rpx-cards-grid--sm">
        <KpiCard icon="👥" value={stats.members.total}        label="Membres"          color="#2ecc71" />
        <KpiCard icon="🆕" value={stats.members.newThisMonth} label="Nouveaux (30j)"   color="#27ae60" />
        <KpiCard icon="📊" value={stats.polls.active}         label="Sondages actifs"  color="#a865d8" />
        <KpiCard icon="🗳️" value={stats.polls.totalVotes}     label="Votes total"      color="#8e44ad" />
      </div>

      <div className="rpx-timestamp">
        Dernière mise à jour : {refreshed.toLocaleTimeString("fr-FR")}
      </div>
    </div>
  );
}
