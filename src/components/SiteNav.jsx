import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { label: "Accueil",    icon: "🏠",  to: "/",           isHash: false },
  { label: "Histoire",   icon: "📖",  to: "/#histoire",  isHash: true },
  { label: "Actualités", icon: "✦",   to: "/actualites", isHash: false },
  { label: "Événements", icon: "🎪",  to: "/evenements", isHash: false },
  { label: "Fan-arts",   icon: "🎨",  to: "/fanarts",    isHash: false },
  { label: "RP",         icon: "🎭",  to: "/rp",         isHash: false },
  { label: "Équipe",     icon: "👥",  to: "/#equipes",   isHash: true },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="navbar">
      <Link to="/" className="nav-brand" onClick={() => setOpen(false)}>
        <img src="/logo_woltar.png" alt="Woltar" className="nav-logo" />
      </Link>

      <button
        className={`nav-hamburger${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
      >
        <span /><span /><span />
      </button>

      <nav className={`nav-links${open ? " is-open" : ""}`}>
        {NAV_LINKS.map((link) => {
          const isActive = !link.isHash && pathname === link.to;
          if (link.isHash) {
            return (
              <a
                key={link.label}
                href={link.to}
                className="nav-link"
                onClick={() => setOpen(false)}
              >
                <span className="nav-symbol">{link.icon}</span>
                <span>{link.label}</span>
              </a>
            );
          }
          return (
            <Link
              key={link.label}
              to={link.to}
              className={`nav-link${isActive ? " nav-link--current" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="nav-symbol">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
        <a
          href="/#association"
          className="nav-link nav-link--association"
          onClick={() => setOpen(false)}
        >
          <span className="nav-symbol">◇</span>
          <span>Association</span>
        </a>
      </nav>
    </header>
  );
}
