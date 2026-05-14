import { supabase, withTimeout } from "./db.js";
import { COMMUNITY_ROLES } from "./communityRoles.js";

let _roles = null;
let _permissions = null;
let _rolePermissions = null;
let _userRoles = null;

export const DEFAULT_ROLES = Object.entries(COMMUNITY_ROLES).map(([name, role]) => ({
  id: `r-${name}`,
  name,
  label: role.label,
  color: role.color,
  level: role.level,
}));

export const DEFAULT_PERMISSIONS = [
  { id: "p-ca",  key: "create_article",    label: "Créer un article",       groupName: "Articles"    },
  { id: "p-ea",  key: "edit_article",      label: "Modifier un article",    groupName: "Articles"    },
  { id: "p-da",  key: "delete_article",    label: "Supprimer un article",   groupName: "Articles"    },
  { id: "p-pa",  key: "publish_article",   label: "Publier un article",     groupName: "Articles"    },
  { id: "p-sa",  key: "schedule_article",  label: "Programmer un article",  groupName: "Articles"    },
  { id: "p-md",  key: "manage_drafts",     label: "Gérer les brouillons",   groupName: "Articles"    },
  { id: "p-me",  key: "manage_events",     label: "Gérer les événements",   groupName: "Événements"  },
  { id: "p-cf",  key: "create_form",       label: "Créer un formulaire",    groupName: "Formulaires" },
  { id: "p-vr",  key: "view_responses",    label: "Voir les réponses",      groupName: "Formulaires" },
  { id: "p-ex",  key: "export_data",       label: "Exporter les données",   groupName: "Formulaires" },
  { id: "p-mt",  key: "manage_tickets",    label: "Gérer les tickets",      groupName: "Tickets"     },
  { id: "p-mc",  key: "manage_categories", label: "Gérer les catégories",  groupName: "Admin"       },
  { id: "p-mu",  key: "manage_users",      label: "Gérer les utilisateurs", groupName: "Admin"       },
  { id: "p-ms",  key: "manage_settings",   label: "Gérer les paramètres",  groupName: "Admin"       },
  { id: "p-mm",  key: "manage_media",      label: "Gérer la médiathèque",  groupName: "Média"       },
  { id: "p-vp",  key: "view_profile",      label: "Voir son profil",       groupName: "Profil"      },
  { id: "p-ep",  key: "edit_profile",      label: "Modifier son profil",   groupName: "Profil"      },
  { id: "p-ad",  key: "access_dashboard",  label: "Accéder au dashboard",  groupName: "Accès"       },
  { id: "p-as",  key: "access_studio",     label: "Accéder au Studio",     groupName: "Accès"       },
  { id: "p-cfa", key: "create_fanarts",    label: "Publier fan-arts",      groupName: "Studio"      },
  { id: "p-cac", key: "create_actualites", label: "Publier actualités",    groupName: "Studio"      },
];

function dispatch() { window.dispatchEvent(new Event("woltar:roles")); }

export function getRoles()           { return _roles           ?? DEFAULT_ROLES;       }
export function getPermissions()     { return _permissions     ?? DEFAULT_PERMISSIONS; }
export function getRolePermissions() { return _rolePermissions ?? [];                  }
export function getUserRoles()       { return _userRoles       ?? [];                  }

export function getRolePermissionIds(roleId) {
  return getRolePermissions()
    .filter((rp) => rp.role_id === roleId)
    .map((rp) => rp.permission_id);
}

export function getUserRoleIds(profileId) {
  return getUserRoles()
    .filter((ur) => ur.profile_id === profileId)
    .map((ur) => ur.role_id);
}

async function loadAll() {
  if (!supabase) return;
  try {
    const [rRes, pRes, rpRes, urRes] = await Promise.all([
      withTimeout(supabase.from("roles").select("*").order("level", { ascending: false })),
      withTimeout(supabase.from("permissions").select("*")),
      withTimeout(supabase.from("role_permissions").select("*")),
      withTimeout(supabase.from("user_roles").select("*")),
    ]);
    if (!rRes.error)  _roles           = (rRes.data || []).map((r) => ({ ...r, groupName: r.group_name }));
    if (!pRes.error)  _permissions     = (pRes.data || []).map((r) => ({ ...r, groupName: r.group_name }));
    if (!rpRes.error) _rolePermissions = rpRes.data || [];
    if (!urRes.error) _userRoles       = urRes.data || [];
    dispatch();
  } catch (err) {
    console.warn("[roles] loadAll failed:", err.message);
  }
}

if (supabase) loadAll();

export async function assignRole(profileId, roleId) {
  if (!supabase) return { ok: false, error: "Supabase non configuré" };
  try {
    const { error } = await withTimeout(
      supabase.from("user_roles").upsert([{ profile_id: profileId, role_id: roleId }])
    );
    if (error) throw error;
    await loadAll();
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

export async function removeRole(profileId, roleId) {
  if (!supabase) return { ok: false, error: "Supabase non configuré" };
  try {
    const { error } = await withTimeout(
      supabase.from("user_roles").delete()
        .eq("profile_id", profileId).eq("role_id", roleId)
    );
    if (error) throw error;
    await loadAll();
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

export async function togglePermission(roleId, permissionId, currentlyHas) {
  if (!supabase) return { ok: false, error: "Supabase non configuré" };
  try {
    if (currentlyHas) {
      await withTimeout(
        supabase.from("role_permissions").delete()
          .eq("role_id", roleId).eq("permission_id", permissionId)
      );
    } else {
      await withTimeout(
        supabase.from("role_permissions").upsert([{ role_id: roleId, permission_id: permissionId }])
      );
    }
    await loadAll();
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}
