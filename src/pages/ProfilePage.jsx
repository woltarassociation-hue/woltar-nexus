import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SiteNav from "../components/SiteNav.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { getProfileByUsername } from "../lib/auth.js";
import { getBadges, getProfileUserBadges } from "../lib/badges.js";
import { getRoleLabel } from "../lib/profileLevels.js";
import { getPresenceLabel } from "../lib/social.js";
import ProfileActivityFeed from "../components/profile/ProfileActivityFeed.jsx";
import ProfileComments from "../components/profile/ProfileComments.jsx";

export default function ProfilePage() {
  const { username } = useParams();
  const { profile: viewerProfile } = useAuth();
  const [ps, setPs] = useState({ loading: true, notFound: false, profile: null });
  const [, setBadgesV] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getProfileByUsername(username)
      .then((p) => {
        if (cancelled) return;
        setPs(
          p
            ? { loading: false, notFound: false, profile: p }
            : { loading: false, notFound: true, profile: null }
        );
      })
      .catch(() => {
        if (!cancelled) setPs({ loading: false, notFound: true, profile: null });
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    const refresh = () => setBadgesV((v) => v + 1);
    window.addEventListener("woltar:badges", refresh);
    return () => window.removeEventListener("woltar:badges", refresh);
  }, []);

  const allBadges = getBadges();
  const userBadges = ps.profile?.id ? getProfileUserBadges(ps.profile.id) : [];
  const visibleBadges = userBadges
    .map((ub) => ({ ...allBadges.find((b) => b.id === ub.badge_id), context: ub.badge_context }))
    .filter((b) => b.id);

  const { loading, notFound, profile } = ps;
  const avatarUrl = profile?.avatar_url || profile?.avatarUrl || null;
  const displayName = profile?.display_name || profile?.displayName || null;
  const createdAt = profile?.created_at || profile?.createdAt || null;
  const lastSeenAt = profile?.last_seen_at || profile?.lastSeenAt || null;

  return (
    <div className="site">
      <SiteNav />
      <div className="pubprofile-page">
        {loading && (
          <div className="pubprofile-card pubprofile-card--loading">
            <div className="auth-loading-spinner" />
          </div>
        )}

        {!loading && notFound && (
          <div className="pubprofile-notfound">
            <p className="pubprofile-notfound-icon">👤</p>
            <h2>Profil introuvable</h2>
            <p>
              L&apos;utilisateur <strong>@{username}</strong> n&apos;existe pas ou n&apos;est pas accessible.
            </p>
            <Link to="/" className="pubprofile-back-btn">
              Retour à l&apos;accueil
            </Link>
          </div>
        )}

        {!loading && profile && (
          <div className="pubprofile-card">
            <div className="pubprofile-avatar-wrap">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile.username}
                  className="pubprofile-avatar"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="pubprofile-avatar-placeholder">
                  {(profile.username || "?")[0].toUpperCase()}
                </div>
              )}
            </div>

            <h1 className="pubprofile-pseudo">{profile.username}</h1>
            {displayName && displayName !== profile.username && (
              <p className="pubprofile-displayname">{displayName}</p>
            )}
            <span className="pubprofile-level">{getRoleLabel(profile.role)}</span>
            <span className="pubprofile-presence">{getPresenceLabel(lastSeenAt)}</span>

            {visibleBadges.length > 0 && (
              <div className="account-badges-strip pubprofile-badges">
                {visibleBadges.map((b) => (
                  <span key={b.id} className={`badge-pill badge-pill--${b.rarity || "common"}`} style={{ background: b.color }}>
                    <span className="badge-pill-icon">{b.icon}</span>
                    <span className="badge-pill-name">{b.name}</span>
                    {b.context && <span className="badge-pill-context">{b.context}</span>}
                  </span>
                ))}
              </div>
            )}

            <hr className="pubprofile-divider" />

            {profile.bio && <p className="pubprofile-bio">{profile.bio}</p>}
            {profile.woltarien1 && (
              <div className="pubprofile-woltariens">
                <p className="pubprofile-woltarien-label">Woltarien(ne)</p>
                <span className="pubprofile-woltarien-val">{profile.woltarien1}</span>
                {profile.woltarien2 && (
                  <span className="pubprofile-woltarien-val pubprofile-woltarien-val--secondary">
                    {profile.woltarien2}
                  </span>
                )}
              </div>
            )}
            {profile.links?.website && (
              <a href={profile.links.website} className="pubprofile-link" target="_blank" rel="noopener noreferrer">
                🔗 {profile.links.website}
              </a>
            )}

            {createdAt && (
              <p className="pubprofile-joindate">
                Membre depuis{" "}
                {new Date(createdAt).toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}

            <ProfileActivityFeed profileId={profile.id} />
            <ProfileComments profileId={profile.id} viewerProfile={viewerProfile} />

            <Link to="/" className="pubprofile-back-link">
              Retour à l&apos;accueil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
