import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMemberSession,
  getMemberById,
  upsertMember,
  setMemberSession,
  clearMemberSession,
} from "../lib/members";
import { MEMBER_ROLE_LABELS } from "../lib/members";

export default function AccountPage() {
  const navigate = useNavigate();
  const session = getMemberSession();

  if (!session) {
    return (
      <div className="setup-page">
        <div className="red-pattern" />
        <div className="setup-glow setup-glow--red" />
        <div className="setup-glow setup-glow--blue" />
        <div className="setup-card">
          <Link to="/" className="setup-back">← Retour au site</Link>
          <img src="/logo_woltar.png" alt="Woltar" className="setup-logo" />
          <p className="setup-domain">woltar.net</p>
          <h1 className="setup-title">Non connecté</h1>
          <p className="setup-subtitle">Tu dois être connecté pour accéder à ton compte.</p>
          <Link to="/inscription" className="setup-btn">S'enregistrer →</Link>
        </div>
      </div>
    );
  }

  const member = getMemberById(session.id) || session;
  return <AccountView member={member} navigate={navigate} />;
}

function AccountView({ member, navigate }) {
  const [avatar, setAvatar] = useState(member.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [woltarien1, setWoltarien1] = useState(member.woltarien1 || "");
  const [woltarien2, setWoltarien2] = useState(member.woltarien2 || "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setError("");
    if (!woltarien1.trim()) { setError("Indique au moins un personnage woltarien."); return; }
    const updated = upsertMember({
      ...member,
      avatar,
      woltarien1: woltarien1.trim(),
      woltarien2: woltarien2.trim() || null,
    });
    setMemberSession(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => {
    clearMemberSession();
    navigate("/");
  };

  return (
    <div className="setup-page">
      <div className="red-pattern" />
      <div className="setup-glow setup-glow--red" />
      <div className="setup-glow setup-glow--blue" />

      <div className="setup-card account-card">
        <Link to="/" className="setup-back">← Retour au site</Link>

        <img src="/logo_woltar.png" alt="Woltar" className="setup-logo" />
        <p className="setup-domain">woltar.net</p>

        <h1 className="setup-title">Mon compte</h1>

        {/* Avatar */}
        <div className="account-avatar-wrap">
          <label className="account-avatar-label" htmlFor="avatar-upload">
            {avatar ? (
              <img src={avatar} alt="avatar" className="account-avatar-img" />
            ) : (
              <div className="account-avatar-placeholder">
                <span>👤</span>
              </div>
            )}
            <div className="account-avatar-overlay">Changer</div>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
        </div>

        <div className="account-pseudo">{member.pseudo}</div>
        <div className="account-role">
          {MEMBER_ROLE_LABELS[member.role] || "Membre"}
        </div>

        <div className="setup-form account-form">
          <div className="setup-field">
            <label className="setup-label">Woltarien(ne) principal(e)</label>
            <input
              className="setup-input"
              type="text"
              value={woltarien1}
              onChange={(e) => { setWoltarien1(e.target.value); setError(""); setSaved(false); }}
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
              onChange={(e) => { setWoltarien2(e.target.value); setSaved(false); }}
              placeholder="Second personnage"
            />
          </div>

          {error && <p className="setup-error">{error}</p>}
          {saved && <p className="account-saved">✓ Modifications enregistrées</p>}

          <button type="button" className="setup-btn setup-btn--full" onClick={handleSave}>
            Enregistrer les modifications →
          </button>
        </div>

        <button className="setup-link account-logout" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
