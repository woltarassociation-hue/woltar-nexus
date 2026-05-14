import { useEffect, useState } from "react";
import { addProfileComment, deleteProfileComment, getProfileComments } from "../../lib/social.js";
import { isAdminRole } from "../../lib/profileLevels.js";

export default function ProfileComments({ profileId, viewerProfile }) {
  const [items, setItems] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canWrite = !!viewerProfile?.id;
  const canModerate = isAdminRole(viewerProfile?.role);

  async function loadComments() {
    setLoading(true);
    setError("");
    try {
      const data = await getProfileComments(profileId, 20);
      setItems(data);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!profileId) return;
      setLoading(true);
      setError("");
      try {
        const data = await getProfileComments(profileId, 20);
        if (mounted) setItems(data);
      } catch (err) {
        if (mounted) setError(err.message || "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    const t = setTimeout(() => {
      void run();
    }, 0);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [profileId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    try {
      await addProfileComment({
        profileId,
        authorId: viewerProfile.id,
        content,
      });
      setContent("");
      await loadComments();
    } catch (err) {
      setError(err.message || "Impossible d'envoyer le commentaire");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!canModerate) return;
    try {
      await deleteProfileComment(id);
      await loadComments();
    } catch (err) {
      setError(err.message || "Impossible de supprimer");
    }
  }

  return (
    <section className="pubprofile-social-block">
      <h3 className="pubprofile-social-title">Commentaires</h3>
      {canWrite ? (
        <form onSubmit={handleSubmit} className="pubprofile-comment-form">
          <textarea
            className="pubprofile-comment-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Laisser un message public…"
            maxLength={500}
            rows={3}
          />
          <button className="pubprofile-comment-btn" type="submit" disabled={saving || !content.trim()}>
            {saving ? "Envoi…" : "Publier"}
          </button>
        </form>
      ) : (
        <p className="pubprofile-social-muted">Connectez-vous pour commenter.</p>
      )}
      {error && <p className="pubprofile-social-error">{error}</p>}
      {loading && <p className="pubprofile-social-muted">Chargement…</p>}
      {!loading && items.length === 0 && <p className="pubprofile-social-muted">Aucun commentaire.</p>}
      {!loading && items.length > 0 && (
        <ul className="pubprofile-comments-list">
          {items.map((item) => (
            <li key={item.id} className="pubprofile-comment-item">
              <div className="pubprofile-comment-head">
                <strong>@{item.author?.username || "membre"}</strong>
                <time>
                  {new Date(item.created_at).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <p>{item.content}</p>
              {canModerate && (
                <button
                  className="pubprofile-comment-delete"
                  type="button"
                  onClick={() => handleDelete(item.id)}
                >
                  Supprimer
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
