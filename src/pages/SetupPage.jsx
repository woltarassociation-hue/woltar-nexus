import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerWithUsername, signInFromMembers } from "../lib/auth.js";
import { isConfigured, saveProfile } from "../lib/profiles";

export default function SetupPage() {
  const navigate = useNavigate();
  const already = isConfigured();

  const [step, setStep] = useState("form"); // "form" | "done"
  const [name, setName] = useState("Administrateur");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) { setError("L'identifiant est requis."); return; }
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    const { user, error: authErr } = await registerWithUsername(username.trim(), password);
    if (authErr) { setError(authErr); return; }
    await saveProfile({
      id:          user?.id || crypto.randomUUID(),
      name:        name.trim() || "Administrateur",
      displayName: name.trim() || "Administrateur",
      role:        "admin",
      username:    username.trim(),
    });
    await signInFromMembers(username.trim(), password);
    setStep("done");
  };

  return (
    <div className="setup-page">


      {/* Particules décoratives */}
      <div className="setup-glow setup-glow--red" />
      <div className="setup-glow setup-glow--blue" />

      <div className="setup-card">
        <Link to="/" className="setup-back">← Retour au site</Link>

        <img src="/logo_woltar.png" alt="Woltar" className="setup-logo" />
        <p className="setup-domain">woltar.net</p>

        {already ? (
          /* ── Déjà configuré ── */
          <>
            <h1 className="setup-title">Espace déjà configuré</h1>
            <p className="setup-subtitle">
              Un compte administrateur existe déjà sur cet appareil.
            </p>
            <div className="setup-already-actions">
              <a href="/#association" className="setup-btn">
                Se connecter →
              </a>
              <p className="setup-already-hint">
                Vous pouvez gérer les profils depuis le tableau de bord une fois connecté.
              </p>
            </div>
          </>
        ) : step === "done" ? (
          /* ── Succès ── */
          <>
            <div className="setup-success-icon">✓</div>
            <h1 className="setup-title">Compte créé !</h1>
            <p className="setup-subtitle">
              Votre espace Woltar est maintenant configuré.<br />
              Vous pouvez vous connecter et accéder au tableau de bord.
            </p>
            <button className="setup-btn" onClick={() => navigate("/association/dashboard")}>
              Ouvrir le tableau de bord →
            </button>
            <button className="setup-link" onClick={() => navigate("/")}>
              Retour à l'accueil
            </button>
          </>
        ) : (
          /* ── Formulaire d'inscription ── */
          <>
            <h1 className="setup-title">Première configuration</h1>
            <p className="setup-subtitle">
              Créez le compte administrateur pour gérer le contenu, les candidatures et les accès de Woltar.net.
            </p>

            <form className="setup-form" onSubmit={handleSubmit}>
              <div className="setup-field">
                <label className="setup-label">Nom du profil</label>
                <input
                  className="setup-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Administrateur"
                />
              </div>

              <div className="setup-field">
                <label className="setup-label">Identifiant de connexion</label>
                <input
                  className="setup-input"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="Ex : association"
                  autoComplete="off"
                  autoFocus
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

              {error && <p className="setup-error">{error}</p>}

              <button type="submit" className="setup-btn setup-btn--full">
                Créer le compte Administrateur →
              </button>
            </form>

            <p className="setup-notice">
              Le mot de passe est géré par Supabase Auth et n'est pas stocké dans le profil.<br />
              D'autres profils pourront être ajoutés depuis le tableau de bord.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
