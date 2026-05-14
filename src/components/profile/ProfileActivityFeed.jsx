import { useEffect, useState } from "react";
import { getRecentActivityForProfile } from "../../lib/social.js";

export default function ProfileActivityFeed({ profileId }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getRecentActivityForProfile(profileId, 6);
        if (mounted) setItems(data);
      } catch (err) {
        if (mounted) setError(err.message || "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (profileId) load();
    return () => {
      mounted = false;
    };
  }, [profileId]);

  return (
    <section className="pubprofile-social-block">
      <h3 className="pubprofile-social-title">Activité récente</h3>
      {loading && <p className="pubprofile-social-muted">Chargement…</p>}
      {error && <p className="pubprofile-social-error">Erreur activité : {error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="pubprofile-social-muted">Aucune activité récente.</p>
      )}
      {!loading && !error && items.length > 0 && (
        <ul className="pubprofile-activity-list">
          {items.map((item) => (
            <li key={item.id} className="pubprofile-activity-item">
              <span className="pubprofile-activity-message">{item.message || item.activity_type}</span>
              <time className="pubprofile-activity-time">
                {new Date(item.created_at).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
