import { useState, useEffect } from "react";
import { clearBadgesCache, getBadges, getProfileUserBadges, reloadBadgesCache, saveProfileBadges } from "../../lib/badges";
import { getProfiles, reloadProfilesCache } from "../../lib/profiles";

const CATEGORY_LABELS = {
  officiel:   "Officiel",
  creation:   "Création",
  communaute: "Communauté",
  evenements: "Événements",
  general:    "Général",
};

const CATEGORY_ORDER = ["officiel", "creation", "communaute", "evenements", "general"];

export default function BadgesSection() {
  const [badges, setBadges]         = useState(() => getBadges());
  const [profiles, setProfiles]     = useState(() => getProfiles());
  const [selectedId, setSelectedId] = useState(null);

  // localBadges: { [profileId]: { badge_id, badge_context }[] }
  const [localBadges, setLocalBadges] = useState({});
  const [saveStatus, setSaveStatus]   = useState(null);
  const [saveError, setSaveError]     = useState("");
  const [loadError, setLoadError]     = useState("");
  const [loading, setLoading]         = useState(false);

  async function loadAll({ invalidate = false } = {}) {
    setLoading(true);
    if (invalidate) clearBadgesCache();
    const [badgesRes, profilesRes] = await Promise.all([
      reloadBadgesCache(),
      reloadProfilesCache(),
    ]);
    setBadges(getBadges());
    setProfiles(getProfiles());
    const errors = [badgesRes, profilesRes]
      .filter((r) => r && r.ok === false)
      .map((r) => r.error)
      .filter(Boolean);
    setLoadError(errors.length > 0 ? errors.join(" | ") : "");
    setLoading(false);
  }

  useEffect(() => {
    const refresh = () => {
      setBadges(getBadges());
      setProfiles(getProfiles());
      setLocalBadges({});
    };
    const refreshProfiles = () => setProfiles(getProfiles());
    window.addEventListener("woltar:badges",   refresh);
    window.addEventListener("woltar:profiles", refreshProfiles);
    const timer = setTimeout(() => { void loadAll(); }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("woltar:badges",   refresh);
      window.removeEventListener("woltar:profiles", refreshProfiles);
    };
  }, []);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus(null), 3000);
    return () => clearTimeout(t);
  }, [saveStatus]);

  const selected = profiles.find((p) => p.id === selectedId) ?? profiles[0];

  function getEffectiveBadges(profileId) {
    if (profileId in localBadges) return localBadges[profileId];
    return getProfileUserBadges(profileId).map((ub) => ({
      badge_id:      ub.badge_id,
      badge_context: ub.badge_context ?? "",
    }));
  }

  function getEffectiveBadgeIds(profileId) {
    return getEffectiveBadges(profileId).map((b) => b.badge_id);
  }

  function hasLocalChanges() {
    return Object.entries(localBadges).some(([profileId, items]) => {
      const remote = getProfileUserBadges(profileId);
      if (items.length !== remote.length) return true;
      return items.some((item) => {
        const r = remote.find((ub) => ub.badge_id === item.badge_id);
        if (!r) return true;
        return (r.badge_context ?? "") !== item.badge_context;
      });
    });
  }

  function toggleBadge(profileId, badgeId) {
    const current  = getEffectiveBadges(profileId);
    const isActive = current.some((b) => b.badge_id === badgeId);
    const next     = isActive
      ? current.filter((b) => b.badge_id !== badgeId)
      : [...current, { badge_id: badgeId, badge_context: "" }];
    setLocalBadges((prev) => ({ ...prev, [profileId]: next }));
    setSaveStatus(null);
  }

  function updateContext(profileId, badgeId, ctx) {
    const next = getEffectiveBadges(profileId).map((b) =>
      b.badge_id === badgeId ? { ...b, badge_context: ctx } : b
    );
    setLocalBadges((prev) => ({ ...prev, [profileId]: next }));
    setSaveStatus(null);
  }

  async function handleSave() {
    setSaveStatus("saving");
    setSaveError("");
    try {
      const results = await Promise.all(
        Object.entries(localBadges).map(([profileId, items]) =>
          saveProfileBadges(profileId, items)
        )
      );
      const failed = results.find((r) => !r.ok);
      if (failed) {
        setSaveError(failed.error || "Erreur inconnue");
        setSaveStatus("error");
      } else {
        setSaveStatus("saved");
      }
    } catch (err) {
      setSaveError(err.message || "Erreur inconnue");
      setSaveStatus("error");
    }
  }

  const isDirty  = hasLocalChanges();
  const isSaving = saveStatus === "saving";

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const catBadges = badges.filter((b) => (b.category || "general") === cat);
    if (catBadges.length > 0) acc[cat] = catBadges;
    return acc;
  }, {});

  return (
    <div className="rpx-panel">
      <div className="rpx-panel-header">
        <div>
          <h2 className="rpx-page-title">◈ BADGES</h2>
          <p className="rpx-page-subtitle">
            Attributs visuels et distinctions — sans effet sur les niveaux d'accès
          </p>
        </div>
        <button
          className="rpx-btn rpx-btn--sm"
          onClick={() => loadAll({ invalidate: true })}
          disabled={loading}
          type="button"
        >
          {loading ? "Chargement..." : "Rafraîchir"}
        </button>
      </div>
      {loadError && (
        <div className="rpx-empty" style={{ color: "#e74c3c", marginBottom: "10px" }}>
          Impossible de charger les badges depuis Supabase : {loadError}
        </div>
      )}

      <div className="rpx-roles-layout">
        {/* ── Sidebar profils ── */}
        <div className="rpx-roles-sidebar">
          <p className="rpx-sidebar-label">Profils</p>
          {profiles.length === 0 ? (
            <p className="rpx-empty">Aucun profil.</p>
          ) : (
            profiles.map((p) => {
              const count   = getEffectiveBadgeIds(p.id).length;
              const isLocal = p.id in localBadges;
              return (
                <button
                  key={p.id}
                  className={`rpx-role-btn${selected?.id === p.id ? " rpx-role-btn--active" : ""}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <span className="rpx-role-dot" style={{ background: isLocal ? "#f39c12" : "#4a4a6a" }} />
                  <span className="rpx-role-btn-label">
                    {p.username || p.pseudo || "—"}
                    {p.locked && <span title="Compte verrouillé"> 🔒</span>}
                  </span>
                  {count > 0 && (
                    <span className="rpx-role-level">{count} badge{count > 1 ? "s" : ""}</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* ── Panel badges groupés ── */}
        <div className="rpx-perms-panel">
          {selected ? (
            <>
              <div className="rpx-perms-header">
                <span className="rpx-role-badge" style={{ background: "#4a4a6a" }}>
                  {selected.username || selected.pseudo || "—"}
                </span>
                {selected.locked ? (
                  <span className="rpx-perms-hint" style={{ color: "#f39c12" }}>
                    🔒 Compte verrouillé — badges modifiables par les admins
                  </span>
                ) : (
                  <span className="rpx-perms-hint">
                    Activez/désactivez les badges · ajoutez un contexte si nécessaire
                  </span>
                )}
              </div>

              {badges.length === 0 ? (
                <div className="rpx-empty">Aucun badge disponible.</div>
              ) : (
                Object.entries(grouped).map(([cat, catBadges]) => (
                  <div key={cat} className="rpx-perm-group">
                    <div className="rpx-perm-group-label">{CATEGORY_LABELS[cat] ?? cat}</div>
                    {catBadges.map((b) => {
                      const active = getEffectiveBadgeIds(selected.id).includes(b.id);
                      const item   = getEffectiveBadges(selected.id).find((x) => x.badge_id === b.id);
                      return (
                        <div key={b.id}>
                          <label className={`rpx-perm-row${active ? " rpx-perm-row--active" : ""}`}>
                            <input
                              type="checkbox"
                              checked={active}
                              disabled={isSaving}
                              onChange={() => toggleBadge(selected.id, b.id)}
                            />
                            <span className="rpx-perm-label rpx-badge-pill-wrap">
                              <span className="rpx-badge-pill" style={{ "--badge-color": b.color }}>
                                <span className="rpx-badge-pill-icon">{b.icon}</span>
                                <span className="rpx-badge-pill-name">{b.name}</span>
                                {b.rarity && b.rarity !== "common" && (
                                  <span className="rpx-badge-pill-rarity">{b.rarity}</span>
                                )}
                              </span>
                              {b.description && <span className="rpx-badge-pill-desc">{b.description}</span>}
                            </span>
                          </label>
                          {active && (
                            <div style={{ paddingLeft: "28px", paddingBottom: "8px" }}>
                              <input
                                className="rpx-input rpx-input--sm"
                                type="text"
                                value={item?.badge_context ?? ""}
                                onChange={(e) => updateContext(selected.id, b.id, e.target.value)}
                                placeholder="Contexte optionnel (ex : Concours Noël 2026)"
                                disabled={isSaving}
                                style={{ width: "100%", maxWidth: "340px" }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="rpx-empty">Sélectionnez un profil.</div>
          )}
        </div>
      </div>

      {/* ── Footer statut + sauvegarde ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderTop: "1px solid #2a2a3a", marginTop: "8px" }}>
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          style={{
            padding: "8px 20px",
            borderRadius: "6px",
            border: "none",
            background: isDirty && !isSaving ? "#1fa8dc" : "#2a2a3a",
            color:      isDirty && !isSaving ? "#fff"    : "#666",
            cursor:     isDirty && !isSaving ? "pointer" : "default",
            fontWeight: 600,
            transition: "background 0.2s",
          }}
        >
          {isSaving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>

        {isDirty && !isSaving && saveStatus !== "saved" && (
          <span style={{ color: "#f39c12", fontSize: "0.85em" }}>● Modifications non enregistrées</span>
        )}
        {saveStatus === "saved" && (
          <span style={{ color: "#2ecc71", fontSize: "0.85em" }}>✓ Enregistré</span>
        )}
        {saveStatus === "error" && (
          <span style={{ color: "#e74c3c", fontSize: "0.85em" }}>✗ Erreur : {saveError}</span>
        )}
      </div>
    </div>
  );
}
