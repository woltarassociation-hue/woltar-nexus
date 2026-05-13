import { useState, useEffect } from "react";
import { getActiveAnnouncement } from "../lib/popups.js";

const TYPE_LABELS = {
  news:        "Actualité",
  event:       "Événement",
  maintenance: "Maintenance",
};

export default function AnnouncementPopup() {
  const [ann, setAnn]         = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    getActiveAnnouncement().then((data) => {
      if (!data) return;
      // Ne pas ré-afficher si déjà fermé dans cette session
      const dismissed = sessionStorage.getItem(`ann_dismissed_${data.id}`);
      if (!dismissed) {
        setAnn(data);
        setVisible(true);
      }
    });
  }, []);

  const close = () => {
    if (ann) sessionStorage.setItem(`ann_dismissed_${ann.id}`, "1");
    setVisible(false);
  };

  if (!visible || !ann) return null;

  const style = ann.style || "glass_cyan";

  return (
    <div className={`ann-popup ann-popup--${style}`} role="dialog" aria-modal="true">
      <div className="ann-popup__backdrop" onClick={close} />
      <div className="ann-popup__box">
        <button className="ann-popup__close" onClick={close} aria-label="Fermer">✕</button>

        <div className="ann-popup__type-badge">
          {TYPE_LABELS[ann.type] || ann.type}
        </div>

        <h2 className="ann-popup__title">{ann.title}</h2>
        <p className="ann-popup__body">{ann.body}</p>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {ann.cta_label && ann.cta_url && (
            <a
              href={ann.cta_url}
              className="ann-popup__cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              {ann.cta_label}
            </a>
          )}
          <button
            className="ann-popup__cta"
            onClick={close}
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
