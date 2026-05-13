import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import {
  getPublishedPolls,
  castVote,
  hasVoted,
  computeResults,
  isPollExpired,
} from "../lib/polls.js";

export default function PollsPage() {
  const { user } = useAuth();
  const [polls, setPolls]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState({});
  const [voted, setVoted]       = useState({});
  const [errors, setErrors]     = useState({});

  useEffect(() => {
    getPublishedPolls().then((data) => {
      setPolls(data);
      setLoading(false);
    });
  }, []);

  const handleVote = async (poll) => {
    const optionIdx = selected[poll.id];
    if (optionIdx === undefined) return;
    const { success, error } = await castVote(
      poll.id,
      optionIdx,
      user?.id || null,
      null
    );
    if (!success) {
      setErrors((prev) => ({ ...prev, [poll.id]: error }));
      return;
    }
    setVoted((prev) => ({ ...prev, [poll.id]: true }));
    // Rafraîchir le sondage
    getPublishedPolls().then(setPolls);
  };

  if (loading) {
    return (
      <div className="polls-page container">
        <div className="poll-empty">Chargement des sondages…</div>
      </div>
    );
  }

  return (
    <div className="polls-page container">
      <div className="polls-header">
        <h1 className="polls-title">Sondages</h1>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          {polls.length} sondage{polls.length !== 1 ? "s" : ""} actif{polls.length !== 1 ? "s" : ""}
        </span>
      </div>

      {polls.length === 0 ? (
        <div className="poll-empty">Aucun sondage en cours pour le moment.</div>
      ) : (
        <div className="polls-grid">
          {polls.map((poll) => {
            const expired  = isPollExpired(poll);
            const alreadyVoted = voted[poll.id] || hasVoted(poll, user?.id);
            const showResults  = alreadyVoted || expired || poll.status === "closed";
            const results      = computeResults(poll);
            const maxPct       = Math.max(...results.map((r) => r.pct), 0);

            return (
              <div
                key={poll.id}
                className={`poll-card${poll.is_pinned ? " poll-card--pinned" : ""}`}
              >
                {poll.is_pinned && (
                  <div className="poll-card__pin">◈ Épinglé</div>
                )}
                <h2 className="poll-card__title">{poll.title}</h2>
                {poll.description && (
                  <p className="poll-card__desc">{poll.description}</p>
                )}
                {poll.expires_at && !expired && (
                  <p className="poll-card__expires">
                    Expire le {new Date(poll.expires_at).toLocaleDateString("fr-FR")}
                  </p>
                )}
                {expired && (
                  <p className="poll-card__expires" style={{ color: "#ff6060" }}>
                    Sondage terminé
                  </p>
                )}

                {/* Options */}
                <div>
                  {results.map((opt) => (
                    <div key={opt.idx} className="poll-option">
                      <label className="poll-option__label">
                        {!showResults && !expired && (
                          <input
                            type="radio"
                            name={`poll-${poll.id}`}
                            value={opt.idx}
                            checked={selected[poll.id] === opt.idx}
                            onChange={() =>
                              setSelected((prev) => ({ ...prev, [poll.id]: opt.idx }))
                            }
                            style={{ marginRight: 6 }}
                          />
                        )}
                        <span style={{ flex: 1 }}>{opt.label}</span>
                        {showResults && (
                          <span className="poll-option__pct">{opt.pct}%</span>
                        )}
                      </label>
                      {showResults && (
                        <div className="poll-option__bar-wrap">
                          <div
                            className={`poll-option__bar${opt.pct === maxPct && opt.pct > 0 ? " poll-option__bar--winner" : ""}`}
                            style={{ width: `${opt.pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {!showResults && !expired && (
                  <>
                    <button
                      className="poll-vote-btn"
                      disabled={selected[poll.id] === undefined}
                      onClick={() => handleVote(poll)}
                    >
                      Voter
                    </button>
                    {errors[poll.id] && (
                      <p className="poll-voted-msg" style={{ color: "#ff6060" }}>
                        {errors[poll.id]}
                      </p>
                    )}
                  </>
                )}
                {showResults && (
                  <p className="poll-voted-msg">
                    {(poll.poll_votes || []).length} vote{(poll.poll_votes || []).length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
