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

const STATUS_LABELS = {
  draft:          "Brouillon",
  pending_review: "En validation",
  published:      "Publié",
  closed:         "Fermé",
  archived:       "Archivé",
};

export default function PollsSection() {
  const { user, hasPermission, profile } = useAuth();
  const canValidate = hasPermission("validate_poll");
  const canManage   = hasPermission("manage_polls");

  const [polls, setPolls]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);

  // Formulaire
  const [title, setTitle]         = useState("");
  const [desc, setDesc]           = useState("");
  const [options, setOptions]     = useState(["", ""]);
  const [expiresAt, setExpiresAt] = useState("");
  const [allowMulti, setAllowMulti] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving]       = useState(false);

  const reload = () => {
    getAllPolls().then((data) => { setPolls(data); setLoading(false); });
  };

  useEffect(() => { reload(); }, []);

  const addOption = () => setOptions((o) => [...o, ""]);
  const removeOption = (i) => setOptions((o) => o.filter((_, idx) => idx !== i));
  const setOption = (i, v) => setOptions((o) => o.map((opt, idx) => idx === i ? v : opt));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!title.trim())                     { setFormError("Titre requis."); return; }
    if (options.filter(Boolean).length < 2){ setFormError("Au moins 2 options."); return; }
    setSaving(true);
    const { error } = await createPoll({
      title: title.trim(),
      description: desc.trim(),
      options: options.filter(Boolean),
      allowMulti,
      expiresAt: expiresAt || null,
      createdBy: user?.id || null,
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
    if (!confirm("Supprimer ce sondage définitivement ?")) return;
    await deletePoll(pollId);
    reload();
  };

  if (loading) return <div className="adm-empty">Chargement…</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 className="adm-section-title" style={{ margin: 0 }}>Sondages</h2>
        {canManage && (
          <button className="adm-btn adm-btn--primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Annuler" : "+ Nouveau sondage"}
          </button>
        )}
      </div>

      {/* Formulaire de création */}
      {showForm && canManage && (
        <form className="poll-create-form" onSubmit={handleCreate}>
          <div className="adm-field">
            <label className="adm-label">Titre du sondage</label>
            <input className="adm-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Quel événement en juin ?" />
          </div>
          <div className="adm-field">
            <label className="adm-label">Description (optionnel)</label>
            <textarea className="adm-input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Contexte ou précisions…" />
          </div>

          <div className="adm-field">
            <label className="adm-label">Options de réponse</label>
            <div className="poll-options-list">
              {options.map((opt, i) => (
                <div key={i} className="poll-option-input">
                  <input
                    className="adm-input"
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    style={{ flex: 1 }}
                  />
                  {options.length > 2 && (
                    <button type="button" className="poll-option-remove" onClick={() => removeOption(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 8 && (
              <button type="button" className="poll-add-option-btn" onClick={addOption}>
                + Ajouter une option
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="adm-field">
              <label className="adm-label">Date d'expiration (optionnel)</label>
              <input className="adm-input" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="adm-field" style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 24 }}>
              <input type="checkbox" id="allow-multi" checked={allowMulti} onChange={(e) => setAllowMulti(e.target.checked)} />
              <label htmlFor="allow-multi" className="adm-label" style={{ margin: 0, cursor: "pointer" }}>
                Choix multiples
              </label>
            </div>
          </div>

          {formError && <p className="adm-error">{formError}</p>}
          <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>
            {saving ? "Création…" : "Créer le sondage (brouillon)"}
          </button>
        </form>
      )}

      {/* Liste des sondages */}
      {polls.length === 0 ? (
        <div className="adm-empty">Aucun sondage.</div>
      ) : (
        <div className="adm-poll-list">
          {polls.map((poll) => {
            const results = computeResults(poll);
            const totalVotes = (poll.poll_votes || []).length;
            return (
              <div key={poll.id} className="adm-poll-row">
                <div className="adm-poll-row__title">
                  {poll.is_pinned && <span style={{ color: "#ffd700", marginRight: 6 }}>◈</span>}
                  {poll.title}
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 8 }}>
                    {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className={`adm-poll-row__status adm-poll-status--${poll.status.replace("_review","")}`}>
                  {STATUS_LABELS[poll.status] || poll.status}
                </span>
                <div className="adm-poll-row__actions">
                  {canValidate && poll.status === "pending_review" && (
                    <button className="adm-poll-btn adm-poll-btn--publish" onClick={() => handleStatus(poll.id, "published")}>
                      Publier
                    </button>
                  )}
                  {canManage && poll.status === "draft" && (
                    <button className="adm-poll-btn adm-poll-btn--publish" onClick={() => handleStatus(poll.id, "pending_review")}>
                      Soumettre
                    </button>
                  )}
                  {canManage && poll.status === "published" && (
                    <button className="adm-poll-btn adm-poll-btn--close" onClick={() => handleStatus(poll.id, "closed")}>
                      Fermer
                    </button>
                  )}
                  {canManage && (
                    <button
                      className="adm-poll-btn adm-poll-btn--pin"
                      onClick={() => handlePin(poll.id, poll.is_pinned)}
                    >
                      {poll.is_pinned ? "Désépingler" : "Épingler"}
                    </button>
                  )}
                  {canManage && (
                    <button className="adm-poll-btn" style={{ color: "#ff6060", borderColor: "rgba(255,80,80,0.3)" }} onClick={() => handleDelete(poll.id)}>
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
