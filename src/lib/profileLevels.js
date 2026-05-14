// Niveaux d'accès communautaires et logique de permissions.
// Source unique de vérité pour les accès frontend.
// Les badges visuels (anciennement "rôles") sont gérés séparément (badges.js — Phase 5).

export const PROFILE_LEVELS = {
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
  communication: {
    label: "Communication",
    color: "#2ecc71",
    level: 50,
    permissions: ["view_profile", "edit_profile", "access_dashboard", "access_studio", "manage_content", "manage_media"],
  },
  administrateur: {
    label: "Administrateur",
    color: "#ff4444",
    level: 100,
    permissions: ["*"],
  },
  dev: {
    label: "Dev",
    color: "#a865d8",
    level: 90,
    permissions: ["*"],
  },
};

// Aliases legacy : anciens rôles Supabase → nouveau niveau d'accès.
// Utilisés uniquement en lecture (normalizeRole) — ne jamais écrire ces valeurs en DB.
export const LEGACY_ROLE_ALIASES = {
  super_admin:  "administrateur",
  admin:        "administrateur",
  membre:       "joueur",
  lecteur:      "visiteur",
  charge_com:   "communication",
  redacteur:    "journaliste",
  custom:       "interim",
  animateur_rp: "interim",
  moderateur:   "interim",
};

// Sections du dashboard et niveaux d'accès autorisés.
// Référence unique pour la visibilité des onglets dans AssociationDashboard.
export const SECTION_ACCESS = {
  studio:     ["artiste", "journaliste", "interim", "communication", "administrateur", "dev"],
  mediatheque:["communication", "administrateur", "dev"],
  profils:    ["administrateur", "dev"],
  tickets:    ["administrateur", "dev"],
  stats:      ["administrateur", "dev"],
  parametres: ["administrateur", "dev"],
};

export const DEFAULT_LEVEL = "visiteur";
export const DEFAULT_ROLE  = DEFAULT_LEVEL; // alias pour compat avec le code existant

export const ROLE_LABELS = Object.fromEntries(
  Object.entries(PROFILE_LEVELS).map(([key, v]) => [key, v.label])
);

export const ROLE_COLORS = Object.fromEntries(
  Object.entries(PROFILE_LEVELS).map(([key, v]) => [key, v.color])
);

// Normalise un niveau d'accès : résout les aliases legacy, fallback sur visiteur.
export function normalizeRole(role) {
  return LEGACY_ROLE_ALIASES[role] || role || DEFAULT_LEVEL;
}

export function getRoleLabel(role) {
  const n = normalizeRole(role);
  return PROFILE_LEVELS[n]?.label || role || ROLE_LABELS[DEFAULT_LEVEL];
}

export function getRoleColor(role) {
  const n = normalizeRole(role);
  return PROFILE_LEVELS[n]?.color || "#7f8c8d";
}

// Vérifie si un niveau d'accès possède une permission donnée.
// Supporte le wildcard "*" (administrateur, dev).
export function hasRolePermission(role, permission) {
  const n = normalizeRole(role);
  const perms = PROFILE_LEVELS[n]?.permissions || [];
  return perms.includes("*") || perms.includes(permission);
}

// Vrai si le niveau est administrateur ou dev (accès complet).
export function isAdminRole(role) {
  const n = normalizeRole(role);
  return n === "administrateur" || n === "dev";
}

// Vrai si le niveau a accès au dashboard.
export function canAccessDashboard(role) {
  return hasRolePermission(role, "access_dashboard");
}

// Vrai si le niveau a accès au studio (éditeur d'articles).
export function canAccessStudio(role) {
  return hasRolePermission(role, "access_studio");
}

// Vrai si le niveau peut accéder à une section du dashboard.
export function canAccessSection(profileLevel, section) {
  const n = normalizeRole(profileLevel);
  return SECTION_ACCESS[section]?.includes(n) ?? false;
}

// Retourne les catégories d'articles autorisées (null = toutes).
export function getAllowedArticleCategories(role) {
  const n = normalizeRole(role);
  if (isAdminRole(n) || ["communication", "interim"].includes(n)) return null;
  if (n === "artiste")     return ["fanarts"];
  if (n === "journaliste") return ["actualites"];
  return [];
}

// Alias backward-compat pour le code qui importe COMMUNITY_ROLES.
export { PROFILE_LEVELS as COMMUNITY_ROLES };
