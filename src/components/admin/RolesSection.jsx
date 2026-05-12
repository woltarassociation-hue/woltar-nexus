import { useState, useEffect } from "react";
import {
  getRoles, getPermissions, getRolePermissions, getUserRoles,
  togglePermission, assignRole, removeRole,
  getRolePermissionIds, getUserRoleIds,
} from "../../lib/roles";
import { getProfiles } from "../../lib/profiles";

export default function RolesSection() {
  const [tab, setTab] = useState("roles");
  const [roles, setRoles] = useState(() => getRoles());
  const [perms, setPerms] = useState(() => getPermissions());
  const [rolePerms, setRolePerms] = useState(() => getRolePermissions());
  const [userRoles, setUserRoles] = useState(() => getUserRoles());
  const [profiles, setProfiles] = useState(() => getProfiles());
  const [selectedRole, setSelectedRole] = useState(null);
  const [saving, setSaving] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const refresh = () => {
      setRoles(getRoles());
      setPerms(getPermissions());
      setRolePerms(getRolePermissions());
      setUserRoles(getUserRoles());
    };
    window.addEventListener("woltar:roles", refresh);
    window.addEventListener("woltar:profiles", () => setProfiles(getProfiles()));
    return () => window.removeEventListener("woltar:roles", refresh);
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
    const already = userRoles.some((ur) => ur.profile_id === profileId && ur.role_id === roleId);
    setSaving(`${profileId}-${roleId}`);
    if (already) await removeRole(profileId, roleId);
    else await assignRole(profileId, roleId);
    setSaving(null);
  };

  return (
    <div className="adm-wrap">
      <div className="adm-inner">
        <h2 className="adm-title">Rôles & Permissions</h2>

        <div className="adm-tabs">
          <button className={`adm-tab${tab === "roles" ? " adm-tab--active" : ""}`} onClick={() => setTab("roles")}>🔐 Permissions par rôle</button>
          <button className={`adm-tab${tab === "users" ? " adm-tab--active" : ""}`} onClick={() => setTab("users")}>👥 Utilisateurs</button>
        </div>

        {/* ── Onglet Rôles & permissions ── */}
        {tab === "roles" && (
          <div className="adm-roles-layout">
            {/* Liste des rôles */}
            <div className="adm-roles-sidebar">
              <p className="adm-sidebar-label">Rôles</p>
              {roles.map((r) => (
                <button
                  key={r.id}
                  className={`adm-role-btn${currentRole?.id === r.id ? " adm-role-btn--active" : ""}`}
                  onClick={() => setSelectedRole(r)}
                  style={{ "--role-color": r.color }}
                >
                  <span className="adm-role-dot" style={{ background: r.color }} />
                  <span>{r.label}</span>
                  <span className="adm-role-level">niv.{r.level}</span>
                </button>
              ))}
            </div>

            {/* Matrice des permissions */}
            <div className="adm-perms-panel">
              {currentRole && (
                <>
                  <div className="adm-perms-header">
                    <span className="adm-role-badge" style={{ background: currentRole.color }}>
                      {currentRole.label}
                    </span>
                    <span className="adm-perms-hint">Cochez les permissions actives pour ce rôle</span>
                  </div>
                  {Object.entries(permGroups).map(([group, groupPerms]) => (
                    <div key={group} className="adm-perm-group">
                      <div className="adm-perm-group-label">{group}</div>
                      {groupPerms.map((p) => {
                        const active = hasPerm(currentRole.id, p.id);
                        return (
                          <label key={p.id} className={`adm-perm-row${active ? " adm-perm-row--active" : ""}`}>
                            <input
                              type="checkbox"
                              checked={active}
                              disabled={saving === p.id}
                              onChange={() => handleTogglePerm(p.id)}
                            />
                            <span className="adm-perm-label">{p.label}</span>
                            {saving === p.id && <span className="adm-spinner" />}
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Onglet Utilisateurs ── */}
        {tab === "users" && (
          <div className="adm-users-list">
            {profiles.length === 0 && (
              <p style={{ color: "#99aabb", fontStyle: "italic", textAlign: "center", padding: 40 }}>
                Aucun profil trouvé.
              </p>
            )}
            {profiles.map((p) => {
              const assigned = userRoles.filter((ur) => ur.profile_id === p.id);
              return (
                <div key={p.id} className="adm-user-row">
                  <div className="adm-user-avatar">
                    {p.avatar ? <img src={p.avatar} alt="" /> : <span>{(p.username || p.pseudo || "?")[0].toUpperCase()}</span>}
                  </div>
                  <div className="adm-user-info">
                    <span className="adm-user-name">{p.username || p.pseudo || "Sans nom"}</span>
                    <span className="adm-user-role-badge" style={{ background: "rgba(139,0,0,0.1)", color: "#8b0000" }}>
                      {p.role || "—"}
                    </span>
                  </div>
                  <div className="adm-user-roles-assigned">
                    {assigned.map((ur) => {
                      const role = roles.find((r) => r.id === ur.role_id);
                      return role ? (
                        <span
                          key={ur.role_id}
                          className="adm-user-role-tag"
                          style={{ background: role.color + "22", color: role.color, borderColor: role.color + "44" }}
                        >
                          {role.label}
                          <button
                            className="adm-user-role-rm"
                            onClick={() => handleAssignRole(p.id, ur.role_id)}
                            disabled={saving === `${p.id}-${ur.role_id}`}
                          >×</button>
                        </span>
                      ) : null;
                    })}
                    <select
                      className="adm-user-role-add"
                      value=""
                      onChange={(e) => e.target.value && handleAssignRole(p.id, e.target.value)}
                    >
                      <option value="">+ Rôle</option>
                      {roles.filter((r) => !assigned.some((ur) => ur.role_id === r.id)).map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
