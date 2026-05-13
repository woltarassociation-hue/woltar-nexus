import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import {
  getAllPolls,
  createPoll,
  updatePollStatus,
  togglePollPin,
  deletePoll,
  computeResults,
} from "../../lib/polls.js";

// ── Constantes ─────────────────────────────────────────────────
const STATUS_LABELS = {
  draft:          "Brouillon",
  pending_review: "En validation",
  published:      "Publié",
  closed:         "Fermé",
  archived:       "Archivé",
};

// ── Heatmap pseudo-aléatoire basée sur poll.id + heure ────────
function pseudoLevel(pollId, hour) {
  const seed = (String(pollId).charCodeAt(0) || 1) * (hour + 1) * 37;
  return seed % 5; // 0-4
}

// ── Onglet Analytiques ─────────────────────────────────────────
function PollAnalytics({ polls }) {
  const analyticsPolls = polls.filter(
    (p) => p.status === "published" || p.status === "closed"
  );

  if (analyticsPolls.length === 0) {
    return <div className="rpx-empty">Aucun sondage publié ou fermé.</div>;
  }

  return (
    <div className="rpx-analytics-list">
      {analyticsPolls.map((poll) => {
        const results    = computeResults(poll);
        const totalVotes = (poll.poll_votes || []).length;
        return (
          <div key={poll.id} className="rpx-analytics-block">
            <div className="rpx-analytics-title">
              {poll.title}
              <span className="rpx-analytics-votes">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
            </div>

            {/* Barres de résultats */}
            <div className="rpx-poll-bars">
              {results.map((opt) => (
                <div key={opt.idx} className="rpx-poll-bar-row">
                  <div className="rpx-poll-bar-label">{opt.label}</div>
                  <div className="rpx-poll-bar-track">
                    <div
                      className="rpx-poll-bar-fill"
                      style={{ width: `${opt.pct}%` }}
                    />
                  </div>
                  <div className="rpx-poll-bar-pct">{opt.pct}%</div>
                </div>
              ))}
            </div>

            {/* Heatmap par heure (simulée) */}
            <div className="rpx-heatmap-label">Activité par heure (simulée)</div>
            <div className="rpx-heatmap">
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="rpx-heatmap-cell"
                  data-level={pseudoLevel(poll.id, h)}
                  title={`${String(h).padStart(2, "0")}h`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────
export default function PollsSection() {
  const { user, hasPermission } = useAuth();
  const canValidate = hasPermission("validate_poll");
  const canManage   = hasPermission("manage_polls");

  const [polls, setPolls]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("index");
  const [showForm, setShowForm]   = useState(false);

  // Formulaire
  const [title, setTitle]           = useState("");
  const [desc, setDesc]             = useState("");
  const [options, setOptions]       = useState(["", ""]);
  const [expiresAt, setExpiresAt]   = useState("");
  const [allowMulti, setAllowMulti] = useState(false);
  const [formError, setFormError]   = useState("");
  const [saving, setSaving]         = useState(false);

  const reload = () => {
    getAllPolls().then((data) => { setPolls(data); setLoading(false); });
  };

  useEffect(() => { reload(); }, []);

  const addOption    = () => setOptions((o) => [...o, ""]);
  const removeOption = (i) => setOptions((o) => o.filter((_, idx) => idx !== i));
  const setOption    = (i, v) => setOptions((o) => o.map((opt, idx) => idx === i ? v : opt));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!title.trim())                      { setFormError("Titre requis."); return; }
    if (options.filter(Boolean).length < 2) { setFormError("Au moins 2 options requises."); return; }
    setSaving(true);
    const { error } = await createPoll({
      title:       title.trim(),
      description: desc.trim(),
      options:     options.filter(Boolean),
      allowMulti,
      expiresAt:   expiresAt || null,
      createdBy:   user?.id  || null,
    });
    setSaving(false);
    if (error) { setFormError(error); return; }
    setTitle(""); setDesc(""); setOptions(["", ""]); setExpiresAt(""); setAllowMulti(false);
    setShowForm(false);
    reload();
  };

  const handleStatus = async (pollId, status) => {
    await updatePollStatus(pollId, status);
    reload();
  };

  const handlePin = async (pollId, current) => {
    await togglePollPin(pollId, !current);
    reload();
  };

  const handleDelete = async (pollId) => {
    if (!window.confirm("Supprimer ce sondage définitivement ?")) return;
    await deletePoll(pollId);
    reload();
  };

  // KPI globaux
  const totalPolls = polls.length;
  const totalVotes = polls.reduce((acc, p) => acc + (p.poll_votes || []).length, 0);
  const avgParticipation = totalPolls > 0
    ? Math.round(totalVotes / totalPolls)
    : 0;

  if (loading) return (
    <div className="rpx-panel">
      <div className="rpx-empty">Chargement…</div>
    </div>
  );

  return (
    <div className="rpx-panel">
      {/* Header */}
      <div className="rpx-panel-header">
        <h2 className="rpx-page-title">◈ SONDAGES</h2>
        {canManage && (
          <button
            className="rpx-btn rpx-btn--primary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Annuler" : "+ Nouveau"}
          </button>
        )}
      </div>

      {/* KPI row */}
      <div className="rpx-kpi-row">
        <div className="rpx-kpi-inline">
          <span className="rpx-kpi-value">{totalPolls}</span>
          <span className="rpx-kpi-label">sondages</span>
        </div>
        <div className="rpx-kpi-inline">
          <span className="rpx-kpi-value">{totalVotes}</span>
          <span className="rpx-kpi-label">votes total</span>
        </div>
        <div className="rpx-kpi-inline">
          <span className="rpx-kpi-value">{avgParticipation}</span>
          <span className="rpx-kpi-label">votes / sondage</span>
        </div>
      </div>

      {/* Formulaire de création */}
      {showForm && canManage && (
        <div className="rpx-form-panel">
          <form className="rpx-form" onSubmit={handleCreate}>
            <div className="rpx-section-title">Nouveau sondage</div>

            <div className="rpx-field">
              <label className="rpx-label">Titre du sondage</label>
              <input
                className="rpx-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Quel événement en juin ?"
              />
            </div>

            <div className="rpx-field">
              <label className="rpx-label">Description (optionnel)</label>
              <textarea
                className="rpx-input rpx-textarea"
                rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Contexte ou précisions…"
              />
            </div>

            <div className="rpx-field">
              <label className="rpx-label">Options de réponse</label>
              <div className="rpx-options-list">
                {options.map((opt, i) => (
                  <div key={i} className="rpx-option-row">
                    <input
                      className="rpx-input"
                      value={opt}
                      onChange={(e) => setOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        className="rpx-btn rpx-btn--sm rpx-btn--danger"
                        onClick={() => removeOption(i)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 8 && (
                <button
                  type="button"
                  className="rpx-btn rpx-btn--sm"
                  onClick={addOption}
                  style={{ marginTop: 8 }}
                >
                  + Ajouter une option
                </button>
              )}
            </div>

            <div className="rpx-form-grid rpx-form-grid--2">
              <div className="rpx-field">
                <label className="rpx-label">Date d'expiration (optionnel)</label>
                <input
                  className="rpx-input"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <div className="rpx-field rpx-field--center">
                <label className="rpx-toggle-row">
                  <span className="rpx-toggle">
                    <input
                      type="checkbox"
                      checked={allowMulti}
                      onChange={(e) => setAllowMulti(e.target.checked)}
                    />
                    <span className="rpx-toggle-slider" />
                  </span>
                  <span className="rpx-label" style={{ margin: 0 }}>Choix multiples</span>
                </label>
              </div>
            </div>

            {formError && <p className="rpx-error">{formError}</p>}

            <button type="submit" className="rpx-btn rpx-btn--primary" disabled={saving}>
              {saving ? "Création…" : "Créer le sondage (brouillon)"}
            </button>
          </form>
        </div>
      )}

      {/* Onglets */}
      <div className="rpx-tabs">
        <button
          className={`rpx-tab${tab === "index" ? " rpx-tab--active" : ""}`}
          onClick={() => setTab("index")}
        >
          Index
        </button>
        <button
          className={`rpx-tab${tab === "analytics" ? " rpx-tab--active" : ""}`}
          onClick={() => setTab("analytics")}
        >
          Analytiques
        </button>
      </div>

      {/* ── Onglet Index ── */}
      {tab === "index" && (
        polls.length === 0 ? (
          <div className="rpx-empty">Aucun sondage.</div>
        ) : (
          <table className="rpx-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Votes</th>
                <th>Statut</th>
                <th>Épinglé</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {polls.map((poll) => {
                const votes = (poll.poll_votes || []).length;
                return (
                  <tr key={poll.id}>
                    <td>{poll.title}</td>
                    <td>{votes}</td>
                    <td>
                      <span className={`rpx-badge rpx-badge--${poll.status.replace("_review", "")}`}>
                        {STATUS_LABELS[poll.status] || poll.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {canManage ? (
                        <button
                          className="rpx-btn rpx-btn--sm"
                          onClick={() => handlePin(poll.id, poll.is_pinned)}
                          title={poll.is_pinned ? "Désépingler" : "Épingler"}
                        >
                          {poll.is_pinned ? "◈" : "○"}
                        </button>
                      ) : (
                        poll.is_pinned ? "◈" : "○"
                      )}
                    </td>
                    <td>
                      <div className="rpx-row-actions">
                        {canManage && poll.status === "draft" && (
                          <button
                            className="rpx-btn rpx-btn--sm rpx-btn--primary"
                            onClick={() => handleStatus(poll.id, "pending_review")}
                          >
                            Soumettre
                          </button>
                        )}
                        {canValidate && poll.status === "pending_review" && (
                          <button
                            className="rpx-btn rpx-btn--sm rpx-btn--success"
                            onClick={() => handleStatus(poll.id, "published")}
                          >
                            Publier
                          </button>
                        )}
                        {canManage && poll.status === "published" && (
                          <button
                            className="rpx-btn rpx-btn--sm"
                            onClick={() => handleStatus(poll.id, "closed")}
                          >
                            Fermer
                          </button>
                        )}
                        {canManage && (
                          <button
                            className="rpx-btn rpx-btn--sm rpx-btn--danger"
                            onClick={() => handleDelete(poll.id)}
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )
      )}

      {/* ── Onglet Analytiques ── */}
      {tab === "analytics" && <PollAnalytics polls={polls} />}
    </div>
  );
}
