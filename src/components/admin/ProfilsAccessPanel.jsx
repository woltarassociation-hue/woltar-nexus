import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import {
  clearBadgesCache, getBadges, getUserBadges, reloadBadgesCache, saveProfileBadges,
} from "../../lib/badges";
import {
  getProfiles, saveProfile, isProtectedAccessProfile, ROLE_LABELS, reloadProfilesCache,
} from "../../lib/profiles";
import {
  PROFILE_LEVELS, normalizeRole, ROLE_COLORS, DEFAULT_LEVEL,
} from "../../lib/profileLevels";

/* ── Constants ── */

const CATEGORY_LABELS = {
  officiel:   "Officiel",
  creation:   "Création",
  communaute: "Communauté",
  evenements: "Événements",
  general:    "Général",
};
const CATEGORY_ORDER = ["officiel", "creation", "communaute", "evenements", "general"];

const PERM_LABELS = {
  view_profile:       "Voir les profils publics",
  edit_profile:       "Modifier son profil",
  vote_poll:          "Voter aux sondages",
  access_dashboard:   "Accès tableau de bord",
  access_studio:      "Studio éditeur",
  create_fanarts:     "Créer fan-arts",
  publish_fanarts:    "Publier fan-arts",
  create_actualites:  "Créer actualités",
  publish_actualites: "Publier actualités",
  manage_content:     "Gérer le contenu",
  manage_media:       "Gérer la médiathèque",
};

/* ── Helpers ── */

function deepEqualBadges(a, b) {
  if (a.length !== b.length) return false;
  const sort = (arr) => [...arr].sort((x, y) => x.badge_id.localeCompare(y.badge_id));
  const sa = sort(a);
  const sb = sort(b);
  return sa.every((x, i) => x.badge_id === sb[i].badge_id && (x.badge_context ?? "") === (sb[i].badge_context ?? ""));
}

/* ── PermissionsPreview ── */

function PermissionsPreview({ role }) {
  const perms = PROFILE_LEVELS[normalizeRole(role)]?.permissions || [];
  const full  = perms.includes("*");
  return (
    <div className="pa-perms">
      <p className="pa-perms-label">Permissions :</p>
      <div className="pa-perms-list">
        {full ? (
          <span className="pa-perm-chip pa-perm-chip--wildcard">★ Accès complet — toutes les permissions</span>
        ) : perms.length === 0 ? (
          <span className="pa-perm-chip pa-perm-chip--none">Aucune permission d'accès</span>
        ) : (
          perms.map((p) => <span key={p} className="pa-perm-chip">{PERM_LABELS[p] || p}</span>)
        )}
      </div>
    </div>
  );
}

/* ── MemberDetail — per-selection state, reset via key prop ── */

function MemberDetail({ selected, isProtected, allBadges, userBadges, grouped, actorId }) {
  // null = not modified by user yet (reads from remote)
  const [localRole,   setLocalRole]   = useState(null);
  const [localBadges, setLocalBadges] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState("");

  /* Derived */

  const displayRole = localRole ?? selected.role;

  const remoteBadges = userBadges
    .filter((ub) => ub.profile_id === selected.id)
    .map((ub) => ({ badge_id: ub.badge_id, badge_context: ub.badge_context ?? "" }));

  function getEffectiveBadges() {
    return localBadges !== null ? localBadges : remoteBadges;
  }

  const roleChanged   = localRole !== null && !isProtected && localRole !== selected.role;
  const badgesChanged = localBadges !== null && !deepEqualBadges(localBadges, remoteBadges);
  const isDirty       = roleChanged || badgesChanged;

  /* Handlers */

  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveErr("");
    try {
      if (roleChanged) {
        await saveProfile({ ...selected, role: localRole }, { actorId });
      }
      if (badgesChanged) {
        const res = await saveProfileBadges(selected.id, getEffectiveBadges(), { actorId });
        if (!res.ok) throw new Error(res.error || "Erreur badges");
      }
      setLocalRole(null);
      setLocalBadges(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveErr(err.message || "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  function toggleBadge(badgeId) {
    const current  = getEffectiveBadges();
    const isActive = current.some((b) => b.badge_id === badgeId);
    const next = isActive
      ? current.filter((b) => b.badge_id !== badgeId)
      : [...current, { badge_id: badgeId, badge_context: "" }];
    setLocalBadges(next);
    setSaved(false);
  }

  function updateContext(badgeId, ctx) {
    const next = getEffectiveBadges().map((b) =>
      b.badge_id === badgeId ? { ...b, badge_context: ctx } : b
    );
    setLocalBadges(next);
    setSaved(false);
  }

  /* Render */

  return (
    <>
      {/* Identity */}
      <div className="pa-identity">
        <div className="pa-avatar">
          {selected.avatarUrl || selected.avatar_url ? (
            <img
              src={selected.avatarUrl || selected.avatar_url}
              alt={selected.username}
              className="pa-avatar-img"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div
              className="pa-avatar-placeholder"
              style={{ background: ROLE_COLORS[selected.role] || "#8b0000" }}
            >
              {(selected.name || selected.username || "?")[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="pa-identity-info">
          <h3 className="pa-identity-name">{selected.name || selected.username}</h3>
          <p className="pa-identity-username">@{selected.username}</p>
          {isProtected && (
            <span className="pa-locked-badge">🔒 Administrateur système — compte protégé</span>
          )}
        </div>
        <button
          className="pa-pubprofile-btn"
          onClick={() => window.open(`/profil/${selected.username}`, "_blank")}
          title="Voir le profil public"
        >
          👁 Profil public
        </button>
      </div>

      <hr className="pa-divider" />

      {/* Access profile */}
      <div className="pa-section">
        <h4 className="pa-detail-section-title">Profil d'accès</h4>
        <select
          className={`db-select pa-role-select${isProtected ? " pa-role-select--locked" : ""}`}
          value={displayRole}
          onChange={(e) => { setLocalRole(e.target.value); setSaved(false); }}
          disabled={isProtected || saving}
        >
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {isProtected && (
          <p className="pa-locked-hint">Le profil d'accès de ce compte ne peut pas être modifié.</p>
        )}
        <PermissionsPreview role={displayRole} />
      </div>

      <hr className="pa-divider" />

      {/* Badges */}
      <div className="pa-section">
        <h4 className="pa-detail-section-title">
          Badges{" "}
          <span className="pa-badges-note">— visuels uniquement, aucun effet sur les droits</span>
        </h4>

        {allBadges.length === 0 ? (
          <p className="pa-empty">Aucun badge configuré.</p>
        ) : (
          Object.entries(grouped).map(([cat, bs]) => (
            <div key={cat} className="pa-badge-group">
              <p className="pa-badge-group-label">{CATEGORY_LABELS[cat] || cat}</p>
              {bs.map((b) => {
                const effective = getEffectiveBadges();
                const active    = effective.some((x) => x.badge_id === b.id);
                const item      = effective.find((x) => x.badge_id === b.id);
                return (
                  <div key={b.id} className="pa-badge-row-wrap">
                    <label
                      className={`pa-badge-row${active ? " pa-badge-row--active" : ""}`}
                      style={{ "--badge-color": b.color }}
                    >
                      <input
                        type="checkbox"
                        className="pa-badge-check"
                        checked={active}
                        disabled={saving}
                        onChange={() => toggleBadge(b.id)}
                      />
                      <span className="pa-badge-pill" style={{ background: b.color }}>
                        <span>{b.icon}</span>
                        <span>{b.name}</span>
                      </span>
                      {b.rarity && b.rarity !== "common" && (
                        <span className={`pa-badge-rarity pa-badge-rarity--${b.rarity}`}>
                          {b.rarity}
                        </span>
                      )}
                      {b.description && (
                        <span className="pa-badge-desc">{b.description}</span>
                      )}
                    </label>
                    {active && (
                      <input
                        className="pa-badge-context"
                        type="text"
                        value={item?.badge_context ?? ""}
                        onChange={(e) => updateContext(b.id, e.target.value)}
                        placeholder="Contexte optionnel (ex : Concours Noël 2026)"
                        disabled={saving}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <hr className="pa-divider" />

      {/* Save bar */}
      <div className="pa-save-bar">
        <button
          className={`pa-save-btn${!isDirty ? " pa-save-btn--idle" : ""}`}
          onClick={handleSave}
          disabled={!isDirty || saving}
        >
          {saving ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer les modifications →"}
        </button>
        {isDirty && !saving && !saved && (
          <span className="pa-dirty-hint">⚠ Modifications non enregistrées</span>
        )}
        {saveErr && <span className="pa-error">{saveErr}</span>}
      </div>
    </>
  );
}

/* ── Main component ── */

export default function ProfilsAccessPanel() {
  const { profile: viewerProfile } = useAuth();
  const [profiles,   setProfiles]   = useState(() => getProfiles());
  const [allBadges,  setAllBadges]  = useState(() => getBadges());
  const [userBadges, setUserBadges] = useState(() => getUserBadges());

  const [selectedId, setSelectedId] = useState(() => getProfiles()[0]?.id ?? null);
  const [creating,   setCreating]   = useState(false);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true); // true = awaiting initial load
  const [loadError,  setLoadError]  = useState("");

  // New-profile form
  const [newName,     setNewName]     = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole,     setNewRole]     = useState(DEFAULT_LEVEL);
  const [newErr,      setNewErr]      = useState("");

  // Fetch from Supabase on mount — no synchronous setState in body
  useEffect(() => {
    Promise.all([reloadBadgesCache(), reloadProfilesCache()]).then(([bRes, pRes]) => {
      setAllBadges(getBadges());
      setProfiles(getProfiles());
      setUserBadges(getUserBadges());
      const errs = [bRes, pRes].filter((r) => r?.ok === false).map((r) => r.error).filter(Boolean);
      setLoadError(errs.join(" | ") || "");
      setLoading(false);
    });
  }, []);

  // Sync on cache events — setters in callbacks, not in effect body
  useEffect(() => {
    const onBadges   = () => { setAllBadges(getBadges()); setUserBadges(getUserBadges()); };
    const onProfiles = () => setProfiles(getProfiles());
    window.addEventListener("woltar:badges",   onBadges);
    window.addEventListener("woltar:profiles", onProfiles);
    return () => {
      window.removeEventListener("woltar:badges",   onBadges);
      window.removeEventListener("woltar:profiles", onProfiles);
    };
  }, []);

  /* Derived */

  const selected    = profiles.find((p) => p.id === selectedId) ?? null;
  const isProtected = selected ? isProtectedAccessProfile(selected) : false;

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const bs = allBadges.filter((b) => (b.category || "general") === cat);
    if (bs.length) acc[cat] = bs;
    return acc;
  }, {});

  const filteredProfiles = profiles
    .filter((p) => {
      const q = search.toLowerCase();
      return !q
        || (p.name     || "").toLowerCase().includes(q)
        || (p.username || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const aLocked = isProtectedAccessProfile(a);
      const bLocked = isProtectedAccessProfile(b);
      if (aLocked && !bLocked) return -1;
      if (!aLocked && bLocked) return 1;
      return (a.name || a.username || "").localeCompare(b.name || b.username || "");
    });

  /* Handlers */

  function handleSelect(id) {
    if (id === selectedId && !creating) return;
    setSelectedId(id);
    setCreating(false);
  }

  function handleNewClick() {
    setCreating(true);
    setSelectedId(null);
    setNewName("");
    setNewUsername("");
    setNewRole(DEFAULT_LEVEL);
    setNewErr("");
  }

  async function handleRefresh() {
    setLoading(true);
    clearBadgesCache();
    const [bRes, pRes] = await Promise.all([reloadBadgesCache(), reloadProfilesCache()]);
    setAllBadges(getBadges());
    setProfiles(getProfiles());
    setUserBadges(getUserBadges());
    const errs = [bRes, pRes].filter((r) => r?.ok === false).map((r) => r.error).filter(Boolean);
    setLoadError(errs.join(" | ") || "");
    setLoading(false);
  }

  async function handleCreate() {
    setNewErr("");
    const name     = newName.trim();
    const username = newUsername.trim();
    if (!name || !username) { setNewErr("Nom et identifiant sont requis."); return; }
    const conflict = profiles.find((p) => p.username.toLowerCase() === username.toLowerCase());
    if (conflict) { setNewErr("Cet identifiant est déjà utilisé."); return; }
    const p = await saveProfile({ id: null, name, username, role: newRole }, { actorId: viewerProfile?.id });
    setCreating(false);
    setSelectedId(p.id);
  }

  /* Render */

  return (
    <div className="pa-shell">
      {/* Header */}
      <div className="pa-header">
        <div>
          <h2 className="pa-title">Profils &amp; Accès</h2>
          <p className="pa-subtitle">Profils d'accès · badges visuels · permissions déduites</p>
        </div>
        <div className="pa-header-actions">
          {loadError && <span className="pa-load-error">⚠ {loadError}</span>}
          <button className="pa-refresh-btn" onClick={handleRefresh} disabled={loading} type="button">
            {loading ? "…" : "Rafraîchir"}
          </button>
        </div>
      </div>

      <div className="pa-layout">
        {/* ── Sidebar ── */}
        <aside className="pa-sidebar">
          <div className="pa-search-wrap">
            <input
              className="pa-search"
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="pa-member-list">
            {filteredProfiles.length === 0 && <p className="pa-empty">Aucun profil.</p>}
            {filteredProfiles.map((p) => {
              const color  = ROLE_COLORS[p.role] || "#999";
              const active = selectedId === p.id && !creating;
              const locked = isProtectedAccessProfile(p);
              return (
                <button
                  key={p.id}
                  className={`pa-member-item${active ? " pa-member-item--active" : ""}`}
                  onClick={() => handleSelect(p.id)}
                  style={{ "--role-color": color }}
                >
                  <span className="pa-member-dot" style={{ background: color }} />
                  <span className="pa-member-info">
                    <span className="pa-member-name">{p.name || p.username}</span>
                    <span className="pa-member-sub">@{p.username}{locked ? " 🔒" : ""}</span>
                  </span>
                  <span className="pa-member-role-chip" style={{ color }}>
                    {ROLE_LABELS[p.role] || p.role}
                  </span>
                </button>
              );
            })}
          </div>

          <button className="pa-new-btn" onClick={handleNewClick}>
            + Nouveau profil
          </button>
        </aside>

        {/* ── Detail panel ── */}
        <main className="pa-detail">

          {/* New-profile form */}
          {creating && (
            <div className="pa-new-form">
              <h3 className="pa-detail-section-title">Nouveau profil d'accès</h3>
              <div className="pa-field-row">
                <div className="pa-field">
                  <label className="pa-label">Nom affiché</label>
                  <input
                    className="db-input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex : Communication"
                  />
                </div>
                <div className="pa-field">
                  <label className="pa-label">Identifiant de connexion</label>
                  <input
                    className="db-input"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Ex : mario.comm"
                    autoComplete="off"
                  />
                </div>
                <div className="pa-field">
                  <label className="pa-label">Profil d'accès</label>
                  <select
                    className="db-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <PermissionsPreview role={newRole} />
              {newErr && <p className="pa-error">{newErr}</p>}
              <div className="pa-actions">
                <button className="pa-save-btn" onClick={handleCreate}>✓ Créer le profil</button>
                <button className="pa-cancel-btn" onClick={() => setCreating(false)}>Annuler</button>
              </div>
            </div>
          )}

          {/* key={id} resets all local state when profile changes */}
          {!creating && selected && (
            <MemberDetail
              key={selected.id}
              selected={selected}
              isProtected={isProtected}
              allBadges={allBadges}
              userBadges={userBadges}
              grouped={grouped}
              actorId={viewerProfile?.id}
            />
          )}

          {/* No selection */}
          {!creating && !selected && (
            <div className="pa-empty-detail">
              <p>Sélectionnez un profil dans la liste ou créez-en un nouveau.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
