import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const ALL_CATS = [
  { id: "actualites", label: "Actualités",  icon: "✦" },
  { id: "evenements", label: "Événements",  icon: "🎪" },
  { id: "fanarts",    label: "Fan-arts",    icon: "🎨" },
  { id: "rp",         label: "RP",          icon: "🎭" },
  { id: "prevention", label: "Prévention",  icon: "🛡" },
  { id: "regles",     label: "Règles",      icon: "📋" },
];

export default function CatPageNav({ currentCategory }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = ALL_CATS.find((c) => c.id === currentCategory);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="cat-topnav" ref={ref}>
      <Link to="/" className="cat-topnav-logo">
        <img src="/logo_woltar.png" alt="Woltar" />
      </Link>

      <div className="cat-topnav-dropdown">
        <button
          className={`catnav-toggle${open ? " catnav-toggle--open" : ""}`}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="catnav-toggle-icon">{current?.icon || "◈"}</span>
          <span className="catnav-toggle-label">{current?.label || "Sections"}</span>
          <span className="catnav-toggle-arrow">{open ? "▴" : "▾"}</span>
        </button>

        <div className={`catnav-panel${open ? " catnav-panel--open" : ""}`}>
          <p className="catnav-panel-header">Explorer les sections</p>
          {ALL_CATS.map((cat) => (
            <Link
              key={cat.id}
              to={`/${cat.id}`}
              className={`catnav-item${cat.id === currentCategory ? " catnav-item--active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="catnav-item-icon">{cat.icon}</span>
              <span className="catnav-item-label">{cat.label}</span>
              {cat.id === currentCategory && <span className="catnav-item-dot">◆</span>}
            </Link>
          ))}
          <Link to="/" className="catnav-home-link" onClick={() => setOpen(false)}>
            🏠 Retour à l'accueil
          </Link>
        </div>
      </div>
    </nav>
  );
}
