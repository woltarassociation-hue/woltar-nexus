export const COMMUNITY_ROLES = {
  visiteur: {
    label: "Visiteur",
    color: "#7f8c8d",
    level: 5,
    permissions: ["view_profile"],
  },
  joueur: {
    label: "Joueur",
    color: "#1fa8dc",
    level: 10,
    permissions: ["view_profile", "edit_profile", "vote_poll"],
  },
  communication: {
    label: "Communication",
    color: "#2ecc71",
    level: 50,
    permissions: ["view_profile", "edit_profile", "access_dashboard", "access_studio", "manage_content", "manage_media"],
  },
  dev: {
    label: "Dev",
    color: "#a865d8",
    level: 90,
    permissions: ["*"],
  },
  artiste: {
    label: "Artiste",
    color: "#e891ff",
    level: 35,
    permissions: ["view_profile", "edit_profile", "access_dashboard", "access_studio", "create_fanarts", "publish_fanarts"],
  },
  journaliste: {
    label: "Journaliste",
    color: "#f1c40f",
    level: 35,
    permissions: ["view_profile", "edit_profile", "access_dashboard", "access_studio", "create_actualites", "publish_actualites"],
  },
  interim: {
    label: "Intérim",
    color: "#e8912a",
    level: 60,
    permissions: ["view_profile", "edit_profile", "access_dashboard", "access_studio"],
  },
  administrateur: {
    label: "Administrateur",
    color: "#ff4444",
    level: 100,
    permissions: ["*"],
  },
};

export const LEGACY_ROLE_ALIASES = {
  super_admin: "administrateur",
  admin: "administrateur",
  membre: "joueur",
  lecteur: "visiteur",
  charge_com: "communication",
  redacteur: "journaliste",
  custom: "interim",
};

export const ROLE_LABELS = Object.fromEntries(
  Object.entries(COMMUNITY_ROLES).map(([key, role]) => [key, role.label])
);

export const ROLE_COLORS = Object.fromEntries(
  Object.entries(COMMUNITY_ROLES).map(([key, role]) => [key, role.color])
);

export const DEFAULT_ROLE = "visiteur";

export function normalizeRole(role) {
  return LEGACY_ROLE_ALIASES[role] || role || DEFAULT_ROLE;
}

export function getRoleLabel(role) {
  const normalized = normalizeRole(role);
  return COMMUNITY_ROLES[normalized]?.label || role || ROLE_LABELS[DEFAULT_ROLE];
}

export function hasRolePermission(role, permission) {
  const normalized = normalizeRole(role);
  const permissions = COMMUNITY_ROLES[normalized]?.permissions || [];
  return permissions.includes("*") || permissions.includes(permission);
}

export function isAdminRole(role) {
  return hasRolePermission(role, "*");
}

export function canAccessDashboard(role) {
  return hasRolePermission(role, "access_dashboard");
}

export function canAccessStudio(role) {
  return hasRolePermission(role, "access_studio");
}

export function getAllowedArticleCategories(role) {
  const normalized = normalizeRole(role);
  if (isAdminRole(normalized) || ["communication", "interim"].includes(normalized)) return null;
  if (normalized === "artiste") return ["fanarts"];
  if (normalized === "journaliste") return ["actualites"];
  return [];
}
