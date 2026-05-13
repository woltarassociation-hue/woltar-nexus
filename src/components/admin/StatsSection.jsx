import { useState, useEffect, useRef } from "react";
import { fetchDashboardStats } from "../../lib/stats.js";

// ── Compteur animé ─────────────────────────────────────────────
function useAnimatedCount(target, duration = 700) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (target == null) return;
    let startVal = 0;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + eased * (target - startVal)));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

// ── KPI Mini (bande supérieure) ────────────────────────────────
function KpiMini({ value, label, mod, max }) {
  const animated = useAnimatedCount(value ?? 0);
  const pct = max && value != null ? Math.min(Math.round((value / max) * 100), 100) : null;

  return (
    <div className={`rpx-kpi-mini${mod ? ` rpx-kpi-mini--${mod}` : ""}`}>
      <span className="rpx-kpi-mini__value">{animated}</span>
      <span className="rpx-kpi-mini__label">{label}</span>
      {pct != null && (
        <div className="rpx-kpi-mini__bar">
          <div className="rpx-kpi-mini__bar-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

// ── Métrique ligne dans une carte ─────────────────────────────
function Metric({ label, value, accent, danger, pct }) {
  const animated = useAnimatedCount(value ?? 0);
  const cls = danger ? "rpx-stat-metric__value--danger"
            : accent ? "rpx-stat-metric__value--accent"
            : "";
  const barMod = danger ? "--danger" : accent ? "" : "";

  return (
    <div className="rpx-stat-metric">
      <span className="rpx-stat-metric__label">{label}</span>
      <span className={`rpx-stat-metric__value ${cls}`}>{animated}</span>
      {pct != null && (
        <div className="rpx-stat-bar" style={{ width: "100%", marginTop: 2 }}>
          <div className={`rpx-stat-bar__fill${barMod ? ` rpx-stat-bar__fill${barMod}` : ""}`} style={{ width: `${Math.min(pct, 100)}%` }} />
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
      <div className="rpx-empty">{error}</div>
    </div>
  );

  const a = stats.articles;
  const m = stats.members;
  const t = stats.tickets;
  const p = stats.polls;

  return (
    <div className="rpx-panel">
      {/* Header */}
      <div className="rpx-panel-header">
        <h2 className="rpx-page-title">◈ STATISTIQUES</h2>
        <button className="rpx-refresh-btn" onClick={load} title="Actualiser">↻ Actualiser</button>
      </div>

      {/* ── Bande KPI ── */}
      <div className="rpx-kpi-strip">
        <KpiMini value={a.published}       label="Articles publiés"   max={a.total} />
        <KpiMini value={a.draft}           label="Brouillons"         mod="grey" />
        <KpiMini value={m.total}           label="Membres"            mod="success" />
        <KpiMini value={m.newThisMonth}    label="Nouveaux (30 j)"    mod="success" max={m.total} />
        <KpiMini value={t.open}            label="Tickets ouverts"    mod="danger"  max={t.total} />
        <KpiMini value={p.active}          label="Sondages actifs"    mod="purple" />
        <KpiMini value={p.totalVotes}      label="Votes total"        mod="purple" />
      </div>

      {/* ── Grille de cartes de détail ── */}
      <div className="rpx-stats-grid">

        {/* Articles */}
        <div className="rpx-stats-card">
          <div className="rpx-stats-card__title">📝 Articles</div>
          <Metric label="Total"     value={a.total} />
          <Metric label="Publiés"   value={a.published} accent pct={a.total ? Math.round((a.published / a.total) * 100) : 0} />
          <Metric label="Brouillons" value={a.draft} />
        </div>

        {/* Tickets */}
        <div className="rpx-stats-card">
          <div className="rpx-stats-card__title">🎫 Tickets support</div>
          <Metric label="Total"    value={t.total} />
          <Metric label="Ouverts"  value={t.open}  danger pct={t.total ? Math.round((t.open / t.total) * 100) : 0} />
          <Metric label="Fermés"   value={(t.total ?? 0) - (t.open ?? 0)} />
        </div>

        {/* Membres */}
        <div className="rpx-stats-card">
          <div className="rpx-stats-card__title">👥 Communauté</div>
          <Metric label="Membres total"     value={m.total} />
          <Metric label="Nouveaux (30 j)"   value={m.newThisMonth} accent pct={m.total ? Math.round((m.newThisMonth / m.total) * 100) : 0} />
        </div>

        {/* Sondages */}
        <div className="rpx-stats-card">
          <div className="rpx-stats-card__title">📊 Sondages</div>
          <Metric label="Sondages actifs" value={p.active} accent />
          <Metric label="Votes total"     value={p.totalVotes} />
        </div>

      </div>

      <div className="rpx-timestamp">
        Mis à jour : {refreshed.toLocaleTimeString("fr-FR")}
      </div>
    </div>
  );
}
