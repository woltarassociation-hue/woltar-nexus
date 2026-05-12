import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getSession } from "../lib/profiles";

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
  const [adminSession, setAdminSession] = useState(() => getSession());
  const { pathname } = useLocation();
  const close = () => setOpen(false);

  useEffect(() => {
    const refresh = () => setAdminSession(getSession());
    window.addEventListener("woltar:profiles", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("woltar:profiles", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const isAdmin = Boolean(adminSession && adminSession.role === "admin");

  return (
    <header className="navbar">
      {/* Left — 3 liens */}
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

      {/* Right — 4 liens + accès admin (si connecté) + compte membre */}
      <nav className="nav-right">
        {RIGHT_LINKS.map((link) => (
          <NavLink
            key={link.label}
            link={link}
            active={!link.isHash && pathname === link.to}
            onClick={close}
          />
        ))}
        {isAdmin && (
          <Link to="/association/dashboard" className="nav-link nav-link--admin" onClick={close}>
            <span className="nav-symbol">⚙</span>
            <span>Admin</span>
          </Link>
        )}
      </nav>

      {/* Hamburger — mobile only */}
      <button
        className={`nav-hamburger${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
      >
        <span /><span /><span />
      </button>

      {/* Mobile dropdown */}
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
          {isAdmin && (
            <Link to="/association/dashboard" className="nav-link nav-link--admin" onClick={close}>
              <span className="nav-symbol">⚙</span>
              <span>Admin</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
