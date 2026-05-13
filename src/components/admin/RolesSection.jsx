import { useState, useEffect } from "react";
import {
  getRoles,
  getPermissions,
  getRolePermissions,
  getUserRoles,
  togglePermission,
  assignRole,
  removeRole,
  getRolePermissionIds,
  getUserRoleIds,
} from "../../lib/roles";
import { getProfiles } from "../../lib/profiles";

// ── Composant principal ────────────────────────────────────────
export default function RolesSection() {
  const [tab, setTab]               = useState("permissions");
  const [roles, setRoles]           = useState(() => getRoles());
  const [perms, setPerms]           = useState(() => getPermissions());
  const [rolePerms, setRolePerms]   = useState(() => getRolePermissions());
  const [userRoles, setUserRoles]   = useState(() => getUserRoles());
  const [profiles, setProfiles]     = useState(() => getProfiles());
  const [selectedRole, setSelectedRole] = useState(null);
  const [saving, setSaving]         = useState(null);

  useEffect(() => {
    const refresh = () => {
      setRoles(getRoles());
      setPerms(getPermissions());
      setRolePerms(getRolePermissions());
      setUserRoles(getUserRoles());
    };
    const refreshProfiles = () => setProfiles(getProfiles());
    window.addEventListener("woltar:roles", refresh);
    window.addEventListener("woltar:profiles", refreshProfiles);
    return () => {
      window.removeEventListener("woltar:roles", refresh);
      window.removeEventListener("woltar:profiles", refreshProfiles);
    };
  }, []);

  // Grouper les permissions par groupe
  const permGroups = perms.reduce((acc, p) => {
    const g = p.groupName || p.group_name || "Général";
    if (!acc[g]) acc[g] = [];
    acc[g].push(p);
    return acc;
  }, {});

  const currentRole = selectedRole ?? roles[0];

  const hasPerm = (roleId, permId) =>
    getRolePermissions().some((rp) => rp.role_id === roleId && rp.permission_id === permId);

  const handleTogglePerm = async (permId) => {
    if (!currentRole) return;
    const currently = hasPerm(currentRole.id, permId);
    setSaving(permId);
    await togglePermission(currentRole.id, permId, currently);
    setSaving(null);
  };

  const handleAssignRole = async (profileId, roleId) => {
    const already = userRoles.some(
      (ur) => ur.profile_id === profileId && ur.role_id === roleId
    );
    setSaving(`${profileId}-${roleId}`);
    if (already) await removeRole(profileId, roleId);
    else await assignRole(profileId, roleId);
    setSaving(null);
  };

  return (
    <div className="rpx-panel">
      {/* Header */}
      <div className="rpx-panel-header">
        <h2 className="rpx-page-title">◈ RÔLES & PERMISSIONS</h2>
      </div>

      {/* Onglets */}
      <div className="rpx-tabs">
        <button
          className={`rpx-tab${tab === "permissions" ? " rpx-tab--active" : ""}`}
          onClick={() => setTab("permissions")}
        >
          Permissions
        </button>
        <button
          className={`rpx-tab${tab === "users" ? " rpx-tab--active" : ""}`}
          onClick={() => setTab("users")}
        >
          Utilisateurs
        </button>
      </div>

      {/* ── Onglet Permissions ── */}
      {tab === "permissions" && (
        <div className="rpx-roles-layout">
          {/* Sidebar rôles */}
          <div className="rpx-roles-sidebar">
            <p className="rpx-sidebar-label">Rôles</p>
            {roles.map((r) => (
              <button
                key={r.id}
                className={`rpx-role-btn${currentRole?.id === r.id ? " rpx-role-btn--active" : ""}`}
                onClick={() => setSelectedRole(r)}
                style={{ "--role-color": r.color }}
              >
                <span className="rpx-role-dot" style={{ background: r.color }} />
                <span className="rpx-role-btn-label">{r.label}</span>
                <span className="rpx-role-level">niv.{r.level}</span>
              </button>
            ))}
          </div>

          {/* Panel permissions */}
          <div className="rpx-perms-panel">
            {currentRole ? (
              <>
                <div className="rpx-perms-header">
                  <span
                    className="rpx-role-badge"
                    style={{ background: currentRole.color }}
                  >
                    {currentRole.label}
                  </span>
                  <span className="rpx-perms-hint">
                    Cochez les permissions actives pour ce rôle
                  </span>
                </div>

                {Object.entries(permGroups).map(([group, groupPerms]) => (
                  <div key={group} className="rpx-perm-group">
                    <div className="rpx-perm-group-label">{group}</div>
                    {groupPerms.map((p) => {
                      const active = hasPerm(currentRole.id, p.id);
                      return (
                        <label
                          key={p.id}
                          className={`rpx-perm-row${active ? " rpx-perm-row--active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            disabled={saving === p.id}
                            onChange={() => handleTogglePerm(p.id)}
                          />
                          <span className="rpx-perm-label">{p.label}</span>
                          {saving === p.id && (
                            <span className="rpx-spinner" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                ))}
              </>
            ) : (
              <div className="rpx-empty">Sélectionnez un rôle.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Onglet Utilisateurs ── */}
      {tab === "users" && (
        <div className="rpx-users-list">
          {profiles.length === 0 ? (
            <div className="rpx-empty">Aucun profil trouvé.</div>
          ) : (
            profiles.map((p) => {
              const assigned = userRoles.filter((ur) => ur.profile_id === p.id);
              return (
                <div key={p.id} className="rpx-user-row">
                  <div className="rpx-user-avatar">
                    {p.avatar ? (
                      <img src={p.avatar} alt="" />
                    ) : (
                      <span>
                        {(p.username || p.pseudo || "?")[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="rpx-user-info">
                    <span className="rpx-user-name">
                      {p.username || p.pseudo || "Sans nom"}
                    </span>
                    {p.role && (
                      <span className="rpx-user-role-badge">{p.role}</span>
                    )}
                  </div>

                  <div className="rpx-user-roles-assigned">
                    {assigned.map((ur) => {
                      const role = roles.find((r) => r.id === ur.role_id);
                      return role ? (
                        <span
                          key={ur.role_id}
                          className="rpx-role-tag"
                          style={{
                            background:   role.color + "22",
                            color:        role.color,
                            borderColor:  role.color + "44",
                          }}
                        >
                          {role.label}
                          <button
                            className="rpx-role-tag-rm"
                            onClick={() => handleAssignRole(p.id, ur.role_id)}
                            disabled={saving === `${p.id}-${ur.role_id}`}
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}

                    <select
                      className="rpx-input rpx-input--sm"
                      value=""
                      onChange={(e) =>
                        e.target.value && handleAssignRole(p.id, e.target.value)
                      }
                    >
                      <option value="">+ Rôle</option>
                      {roles
                        .filter((r) => !assigned.some((ur) => ur.role_id === r.id))
                        .map((r) => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
