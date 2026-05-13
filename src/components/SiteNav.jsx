import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

const LEFT_LINKS = [
  { label: "Accueil",    icon: "🏠",  to: "/",            isHash: false },
  { label: "Histoire",   icon: "📖",  to: "/#histoire",   isHash: true  },
  { label: "Actualités", icon: "✦",   to: "/actualites",  isHash: false },
  { label: "Événements", icon: "🎪",  to: "/evenements",  isHash: false },
];

const RIGHT_LINKS = [
  { label: "Fan-arts", icon: "🎨", to: "/fanarts",  isHash: false },
  { label: "RP",       icon: "🎭", to: "/rp",       isHash: false },
  { label: "Tickets",  icon: "🎫", to: "/tickets",  isHash: false },
];

function NavLink({ link, active, onClick }) {
  const cls = `nav-link${active ? " nav-link--current" : ""}`;
  if (link.isHash) {
    return (
      <a href={link.to} className={cls} onClick={onClick}>
        <span className="nav-symbol">{link.icon}</span>
        <span>{link.label}</span>
      </a>
    );
  }
  return (
    <Link to={link.to} className={cls} onClick={onClick}>
      <span className="nav-symbol">{link.icon}</span>
      <span>{link.label}</span>
    </Link>
  );
}

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAdmin, user } = useAuth();
  const close = () => setOpen(false);

  // 4e lien droit dynamique — garde le même nombre de boutons des deux côtés
  function AuthLink({ onClick }) {
    if (isAdmin) {
      return (
        <Link to="/association/dashboard" className="nav-link nav-link--admin" onClick={onClick}>
          <span className="nav-symbol">⚙</span>
          <span>Admin</span>
        </Link>
      );
    }
    if (user) {
      return (
        <Link to="/compte" className="nav-link" onClick={onClick}>
          <span className="nav-symbol">👤</span>
          <span>Profil</span>
        </Link>
      );
    }
    return (
      <Link to="/login" className="nav-link nav-link--login" onClick={onClick}>
        <span className="nav-symbol">🔑</span>
        <span>Connexion</span>
      </Link>
    );
  }

  return (
    <header className="navbar">
      {/* Gauche — 4 liens */}
      <nav className="nav-left">
        {LEFT_LINKS.map((link) => (
          <NavLink
            key={link.label}
            link={link}
            active={!link.isHash && pathname === link.to}
            onClick={close}
          />
        ))}
      </nav>

      {/* Logo centré */}
      <div className="nav-brand">
        <Link to="/" className="nav-logo-link" onClick={close}>
          <img src="/logo_woltar.png" alt="Woltar" className="nav-logo" />
        </Link>
        <a
          href="https://www.woltar.net"
          className="nav-wordmark"
          target="_blank"
          rel="noopener noreferrer"
        >
          woltar.net
        </a>
      </div>

      {/* Droite — 4 liens (3 fixes + 1 auth) */}
      <nav className="nav-right">
        {RIGHT_LINKS.map((link) => (
          <NavLink
            key={link.label}
            link={link}
            active={!link.isHash && pathname === link.to}
            onClick={close}
          />
        ))}
        <AuthLink onClick={close} />
      </nav>

      {/* Hamburger — mobile uniquement */}
      <button
        className={`nav-hamburger${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
      >
        <span /><span /><span />
      </button>

      {/* Menu mobile déroulant */}
      {open && (
        <div className="nav-mobile">
          {[...LEFT_LINKS, ...RIGHT_LINKS].map((link) => (
            <NavLink
              key={link.label}
              link={link}
              active={!link.isHash && pathname === link.to}
              onClick={close}
            />
          ))}
          <AuthLink onClick={close} />
        </div>
      )}
    </header>
  );
}
