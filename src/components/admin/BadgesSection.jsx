import { useState, useEffect } from "react";
import { getBadges, getBadgeIdsForProfile, saveProfileBadges } from "../../lib/badges";
import { getProfiles } from "../../lib/profiles";

export default function BadgesSection() {
  const [badges, setBadges]     = useState(() => getBadges());
  const [profiles, setProfiles] = useState(() => getProfiles());
  const [selectedId, setSelectedId] = useState(null);

  // localBadgeIds: { [profileId]: string[] } — pending changes before save
  const [localBadgeIds, setLocalBadgeIds] = useState({});
  const [saveStatus, setSaveStatus]       = useState(null); // null | 'saving' | 'saved' | 'error'
  const [saveError, setSaveError]         = useState("");

  useEffect(() => {
    const refresh = () => {
      setBadges(getBadges());
      setProfiles(getProfiles());
      // Reset local overrides when remote data refreshes after a save
      setLocalBadgeIds({});
    };
    window.addEventListener("woltar:badges",   refresh);
    window.addEventListener("woltar:profiles", () => setProfiles(getProfiles()));
    return () => {
      window.removeEventListener("woltar:badges",   refresh);
      window.removeEventListener("woltar:profiles", () => setProfiles(getProfiles()));
    };
  }, []);

  // Auto-dismiss 'saved' after 3 s
  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus(null), 3000);
    return () => clearTimeout(t);
  }, [saveStatus]);

  const selected = profiles.find((p) => p.id === selectedId) ?? profiles[0];

  function getEffectiveBadgeIds(profileId) {
    if (profileId in localBadgeIds) return localBadgeIds[profileId];
    return getBadgeIdsForProfile(profileId);
  }

  function hasLocalChanges() {
    return Object.entries(localBadgeIds).some(([profileId, ids]) => {
      const remote = getBadgeIdsForProfile(profileId);
      return ids.length !== remote.length || ids.some((id) => !remote.includes(id));
    });
  }

  function toggleBadge(profileId, badgeId) {
    const current = getEffectiveBadgeIds(profileId);
    const next = current.includes(badgeId)
      ? current.filter((id) => id !== badgeId)
      : [...current, badgeId];
    setLocalBadgeIds((prev) => ({ ...prev, [profileId]: next }));
    setSaveStatus(null);
  }

  async function handleSave() {
    setSaveStatus("saving");
    setSaveError("");
    try {
      const results = await Promise.all(
        Object.entries(localBadgeIds).map(([profileId, ids]) =>
          saveProfileBadges(profileId, ids)
        )
      );
      const failed = results.find((r) => !r.ok);
      if (failed) {
        setSaveError(failed.error || "Erreur d'enregistrement");
        setSaveStatus("error");
      } else {
        setSaveStatus("saved");
        // localBadgeIds cleared by woltar:badges event after loadAll()
      }
    } catch (err) {
      setSaveError(err.message || "Erreur inconnue");
      setSaveStatus("error");
    }
  }

  const isDirty  = hasLocalChanges();
  const isSaving = saveStatus === "saving";

  return (
    <div className="rpx-panel">
      <div className="rpx-panel-header">
        <h2 className="rpx-page-title">◈ BADGES</h2>
        <p className="rpx-page-subtitle">Attributs visuels et distinctions — sans effet sur les niveaux d'accès</p>
      </div>

      <div className="rpx-roles-layout">
        {/* ── Sidebar profils ── */}
        <div className="rpx-roles-sidebar">
          <p className="rpx-sidebar-label">Profils</p>
          {profiles.length === 0 ? (
            <p className="rpx-empty">Aucun profil.</p>
          ) : (
            profiles.map((p) => {
              const count   = getEffectiveBadgeIds(p.id).length;
              const isLocal = p.id in localBadgeIds;
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

        {/* ── Panel badges ── */}
        <div className="rpx-perms-panel">
          {selected ? (
            <>
              <div className="rpx-perms-header">
                <span className="rpx-role-badge" style={{ background: "#4a4a6a" }}>
                  {selected.username || selected.pseudo || "—"}
                </span>
                {selected.locked && (
                  <span className="rpx-perms-hint" style={{ color: "#f39c12" }}>
                    🔒 Compte verrouillé — badges modifiables par les admins
                  </span>
                )}
                {!selected.locked && (
                  <span className="rpx-perms-hint">Activez/désactivez les badges pour ce profil</span>
                )}
              </div>

              {badges.length === 0 ? (
                <div className="rpx-empty">Aucun badge disponible.</div>
              ) : (
                <div className="rpx-perm-group">
                  {badges.map((b) => {
                    const active = getEffectiveBadgeIds(selected.id).includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className={`rpx-perm-row${active ? " rpx-perm-row--active" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          disabled={isSaving}
                          onChange={() => toggleBadge(selected.id, b.id)}
                        />
                        <span
                          className="rpx-perm-label"
                          style={{ display: "flex", alignItems: "center", gap: "8px" }}
                        >
                          <span>{b.icon}</span>
                          <span style={{ color: b.color, fontWeight: active ? 600 : 400 }}>
                            {b.name}
                          </span>
                          {b.description && (
                            <span style={{ opacity: 0.55, fontSize: "0.8em" }}>— {b.description}</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="rpx-empty">Sélectionnez un profil.</div>
          )}
        </div>
      </div>

      {/* ── Footer statut + sauvegarde ── */}
      <div className="rpx-footer" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderTop: "1px solid #2a2a3a", marginTop: "8px" }}>
        <button
          className="rpx-save-btn"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          style={{
            padding: "8px 20px",
            borderRadius: "6px",
            border: "none",
            background: isDirty && !isSaving ? "#1fa8dc" : "#2a2a3a",
            color: isDirty && !isSaving ? "#fff" : "#666",
            cursor: isDirty && !isSaving ? "pointer" : "default",
            fontWeight: 600,
            transition: "background 0.2s",
          }}
        >
          {isSaving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>

        {isDirty && !isSaving && saveStatus !== "saved" && (
          <span style={{ color: "#f39c12", fontSize: "0.85em" }}>
            ● Modifications non enregistrées
          </span>
        )}
        {saveStatus === "saved" && (
          <span style={{ color: "#2ecc71", fontSize: "0.85em" }}>
            ✓ Enregistré
          </span>
        )}
        {saveStatus === "error" && (
          <span style={{ color: "#e74c3c", fontSize: "0.85em" }}>
            ✗ Erreur : {saveError}
          </span>
        )}
      </div>
    </div>
  );
}
