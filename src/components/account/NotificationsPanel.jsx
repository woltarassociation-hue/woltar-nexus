import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "../../lib/social.js";

export default function NotificationsPanel({ profileId }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!profileId) return;
      setLoading(true);
      setError("");
      try {
        const data = await getNotifications(profileId, 20);
        if (mounted) setItems(data);
      } catch (err) {
        if (mounted) setError(err.message || "Impossible de charger les notifications");
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

  async function toggleRead(item) {
    try {
      await markNotificationRead(item.id, !item.is_read);
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: !n.is_read } : n))
      );
    } catch (err) {
      setError(err.message || "Erreur de mise à jour");
    }
  }

  return (
    <section className="account-notifs">
      <h2 className="account-notifs-title">Notifications</h2>
      {loading && <p className="account-notifs-muted">Chargement…</p>}
      {error && <p className="account-notifs-error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="account-notifs-muted">Aucune notification.</p>
      )}
      {!loading && !error && items.length > 0 && (
        <ul className="account-notifs-list">
          {items.map((item) => (
            <li key={item.id} className={`account-notif-item${item.is_read ? " is-read" : ""}`}>
              <div>
                <p className="account-notif-title">{item.title || "Information"}</p>
                {item.body && <p className="account-notif-body">{item.body}</p>}
                <time className="account-notif-time">
                  {new Date(item.created_at).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <button type="button" className="account-notif-toggle" onClick={() => toggleRead(item)}>
                {item.is_read ? "Non lu" : "Lu"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
