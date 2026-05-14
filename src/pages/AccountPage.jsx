import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { signOut } from "../lib/auth.js";
import { saveProfile } from "../lib/profiles";
import { getRoleLabel } from "../lib/profileLevels";
import { compressImage } from "../lib/imageUtils";
import { getBadges, getProfileUserBadges } from "../lib/badges";

export default function AccountPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="setup-page">
        <div className="setup-card" style={{ textAlign: "center", padding: "60px 32px" }}>
          <div className="auth-loading-spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="setup-page">
        <div className="setup-glow setup-glow--red" />
        <div className="setup-glow setup-glow--blue" />
        <div className="setup-card">
          <Link to="/" className="setup-back">← Retour au site</Link>
          <img src="/logo_woltar.png" alt="Woltar" className="setup-logo" />
          <p className="setup-domain">woltar.net</p>
          <h1 className="setup-title">Non connecté</h1>
          <p className="setup-subtitle">Tu dois être connecté pour accéder à ton compte.</p>
          <Link to="/login" className="setup-btn">Se connecter →</Link>
          <Link to="/inscription" className="setup-link">Pas encore de compte ?</Link>
        </div>
      </div>
    );
  }

  return <AccountView user={user} profile={profile} navigate={navigate} />;
}

function AccountView({ user, profile, navigate }) {
  const [displayName, setDisplayName] = useState(profile?.displayName || profile?.display_name || profile?.name || profile?.username || "");
  const [avatar, setAvatar]         = useState(profile?.avatarUrl || profile?.avatar_url || null);
  const [bio, setBio]               = useState(profile?.bio || "");
  const [woltarien1, setWoltarien1] = useState(profile?.woltarien1 || "");
  const [woltarien2, setWoltarien2] = useState(profile?.woltarien2 || "");
  const [links, setLinks]           = useState(profile?.links || {});
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState("");

  const [allBadges, setAllBadges]       = useState(() => getBadges());
  const [userBadges, setUserBadges]     = useState(() => profile?.id ? getProfileUserBadges(profile.id) : []);

  useEffect(() => {
    const refresh = () => {
      setAllBadges(getBadges());
      if (profile?.id) setUserBadges(getProfileUserBadges(profile.id));
    };
    window.addEventListener("woltar:badges", refresh);
    return () => window.removeEventListener("woltar:badges", refresh);
  }, [profile?.id]);

  const pseudo = profile?.username || user.username || user.pseudo || "Membre";

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.88 });
      setAvatar(compressed);
    } catch {
      setError("Impossible de charger l'image.");
    }
  };

  const handleSave = async () => {
    setError("");
    await saveProfile({
      ...(profile || {}),
      id:          profile?.id || user.id,
      authId:      user.id,
      username:    pseudo,
      name:        displayName.trim() || pseudo,
      displayName: displayName.trim() || pseudo,
      avatarUrl:   avatar,
      bio:         bio.trim(),
      woltarien1:  woltarien1.trim(),
      woltarien2: woltarien2.trim() || null,
      links,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="setup-page">
      <div className="setup-glow setup-glow--red" />
      <div className="setup-glow setup-glow--blue" />

      <div className="setup-card account-card">
        <Link to="/" className="setup-back">← Retour au site</Link>
        <img src="/logo_woltar.png" alt="Woltar" className="setup-logo" />
        <p className="setup-domain">woltar.net</p>
        <h1 className="setup-title">Mon compte</h1>

        <div className="account-avatar-wrap">
          <label className="account-avatar-label" htmlFor="avatar-upload">
            {avatar ? (
              <img src={avatar} alt="avatar" className="account-avatar-img" />
            ) : (
              <div className="account-avatar-placeholder"><span>👤</span></div>
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

        <div className="account-pseudo">{pseudo}</div>
        <div className="account-role">
          {getRoleLabel(profile?.role)}
        </div>
        <BadgeStrip allBadges={allBadges} userBadges={userBadges} />

        <div className="setup-form account-form">
          <div className="setup-field">
            <label className="setup-label">Pseudo affiché</label>
            <input
              className="setup-input"
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setError(""); setSaved(false); }}
              placeholder="Nom affiché sur Woltar Nexus"
            />
          </div>

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
            <label className="setup-label">Bio</label>
            <textarea
              className="setup-input"
              value={bio}
              onChange={(e) => { setBio(e.target.value); setSaved(false); }}
              placeholder="Quelques mots sur toi, ton RP, tes créations..."
              rows={4}
            />
          </div>

          <div className="setup-field">
            <label className="setup-label">Lien / réseau</label>
            <input
              className="setup-input"
              type="url"
              value={links.website || ""}
              onChange={(e) => { setLinks((prev) => ({ ...prev, website: e.target.value })); setSaved(false); }}
              placeholder="https://..."
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

          {error  && <p className="setup-error">{error}</p>}
          {saved  && <p className="account-saved">✓ Modifications enregistrées</p>}

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

function BadgeStrip({ allBadges, userBadges }) {
  if (userBadges.length === 0) return null;

  const visible = userBadges
    .map((ub) => ({ ...allBadges.find((b) => b.id === ub.badge_id), context: ub.badge_context }))
    .filter((b) => b.id);

  if (visible.length === 0) return null;

  return (
    <div className="account-badges-strip">
      {visible.map((b) => {
        const isLegendary = b.rarity === "legendary";
        const isEpic      = b.rarity === "epic";
        const glow = isLegendary
          ? `0 0 14px ${b.color}99`
          : isEpic
          ? `0 0 7px ${b.color}66`
          : "none";
        const label = [b.name, b.context].filter(Boolean).join(" — ");
        const tipText = [b.description, b.context ? `(${b.context})` : ""].filter(Boolean).join(" ");

        return (
          <span
            key={b.id}
            className={`badge-pill badge-pill--${b.rarity || "common"}`}
            style={{ background: b.color, boxShadow: glow }}
            title={tipText || b.name}
            aria-label={label}
          >
            <span className="badge-pill-icon">{b.icon}</span>
            <span className="badge-pill-name">{b.name}</span>
            {b.context && <span className="badge-pill-context">{b.context}</span>}
          </span>
        );
      })}
    </div>
  );
}
