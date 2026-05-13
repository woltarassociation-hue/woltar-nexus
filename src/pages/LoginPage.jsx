import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { signInFromMembers } from "../lib/auth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/association/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { user, error: err } = await signInFromMembers(username, password);
    setLoading(false);
    if (err) { setError(err); return; }
    const dest = user?.role === "admin" || user?.role === "super_admin"
      ? "/association/dashboard"
      : redirectTo;
    navigate(dest, { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/">
          <img src="/logo_woltar.png" alt="Woltar" className="login-logo" />
        </Link>
        <h1 className="login-title">Espace membres</h1>
        <p className="login-subtitle">
          Connectez-vous avec votre pseudo pour accéder à vos outils.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="assoc-field">
            <label className="assoc-label">Pseudo</label>
            <input
              className="assoc-input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              placeholder="votre_pseudo"
              required
            />
          </div>
          <div className="assoc-field">
            <label className="assoc-label">Mot de passe</label>
            <input
              className="assoc-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="assoc-error">{error}</p>}
          <button type="submit" className="association-login-btn" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter →"}
          </button>
        </form>

        <Link to="/" className="assoc-register-link">← Retour au site</Link>
      </div>
    </div>
  );
}
