import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerWithUsername, signInFromMembers } from "../lib/auth.js";
import { getProfiles, saveProfile } from "../lib/profiles";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [pseudo, setPseudo]         = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [woltarien1, setWoltarien1] = useState("");
  const [woltarien2, setWoltarien2] = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!pseudo.trim())               { setError("Le pseudo est requis."); return; }
    if (getProfiles().some((p) => p.username?.trim().toLowerCase() === pseudo.trim().toLowerCase())) {
      setError("Ce pseudo est déjà utilisé.");
      return;
    }
    if (password.length < 6)          { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (password !== confirm)         { setError("Les mots de passe ne correspondent pas."); return; }
    if (!woltarien1.trim())           { setError("Indique au moins un personnage woltarien."); return; }

    setLoading(true);
    const { user, error: authErr } = await registerWithUsername(pseudo.trim(), password);
    if (authErr) { setError(authErr); setLoading(false); return; }

    // Enregistrer le profil applicatif (sans mot de passe)
    await saveProfile({
      id:          user?.id || crypto.randomUUID(),
      name:        pseudo.trim(),
      username:    pseudo.trim(),
      displayName: pseudo.trim(),
      role:        "visiteur",
      woltarien1:  woltarien1.trim(),
      woltarien2:  woltarien2.trim() || null,
    });

    const { error: loginErr } = await signInFromMembers(pseudo.trim(), password);
    setLoading(false);
    if (loginErr) {
      setError("Compte créé. Connecte-toi avec ton pseudo et ton mot de passe pour accéder à ton compte.");
      return;
    }
    setDone(true);
  };

  return (
    <div className="setup-page">
      <div className="setup-glow setup-glow--red" />
      <div className="setup-glow setup-glow--blue" />

      <div className="setup-card">
        <Link to="/" className="setup-back">← Retour au site</Link>

        <img src="/logo_woltar.png" alt="Woltar" className="setup-logo" />
        <p className="setup-domain">woltar.net</p>

        {done ? (
          <>
            <div className="setup-success-icon">✓</div>
            <h1 className="setup-title">Bienvenue !</h1>
            <p className="setup-subtitle">
              Ton compte <strong>{pseudo}</strong> a été créé.<br />
              Tu fais désormais partie de la communauté Woltar.
            </p>
            <button className="setup-btn" onClick={() => navigate("/")}>
              Retour à l'accueil →
            </button>
            <button className="setup-link" onClick={() => navigate("/compte")}>
              Accéder à mon compte
            </button>
          </>
        ) : (
          <>
            <h1 className="setup-title">S'enregistrer</h1>
            <p className="setup-subtitle">
              Crée ton compte communautaire pour rejoindre l'univers Woltar.
            </p>

            <form className="setup-form" onSubmit={handleSubmit}>
              <div className="setup-field">
                <label className="setup-label">Pseudo</label>
                <input
                  className="setup-input"
                  type="text"
                  value={pseudo}
                  onChange={(e) => { setPseudo(e.target.value); setError(""); }}
                  placeholder="Ton pseudo en jeu"
                  autoFocus
                  autoComplete="username"
                />
              </div>

              <div className="setup-field">
                <label className="setup-label">Mot de passe</label>
                <div className="setup-pass-wrap">
                  <input
                    className="setup-input"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="6 caractères minimum"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="setup-pass-toggle"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div className="setup-field">
                <label className="setup-label">Confirmer le mot de passe</label>
                <input
                  className="setup-input"
                  type={showPass ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <div className="setup-field">
                <label className="setup-label">Woltarien(ne) principal(e)</label>
                <input
                  className="setup-input"
                  type="text"
                  value={woltarien1}
                  onChange={(e) => { setWoltarien1(e.target.value); setError(""); }}
                  placeholder="Prénom et NOM du personnage"
                />
              </div>

              <div className="setup-field">
                <label className="setup-label">
                  Woltarien(ne) secondaire <span className="reg-optional">(optionnel)</span>
                </label>
                <input
                  className="setup-input"
                  type="text"
                  value={woltarien2}
                  onChange={(e) => setWoltarien2(e.target.value)}
                  placeholder="Second personnage (si applicable)"
                />
              </div>

              {error && <p className="setup-error">{error}</p>}

              <button
                type="submit"
                className="setup-btn setup-btn--full"
                disabled={loading}
              >
                {loading ? "Création du compte…" : "Créer mon compte →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
