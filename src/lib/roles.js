import { supabase, withTimeout } from "./db.js";

let _roles = null;
let _permissions = null;
let _rolePermissions = null;
let _userRoles = null;

export const DEFAULT_ROLES = [
  { id: "r-super",   name: "super_admin",  label: "Super Admin",          color: "#ff4444", level: 100 },
  { id: "r-admin",   name: "admin",        label: "Admin",                color: "#8b0000", level: 90  },
  { id: "r-com",     name: "charge_com",   label: "Chargé communication", color: "#1fa8dc", level: 70  },
  { id: "r-rp",      name: "animateur_rp", label: "Animateur RP",         color: "#a865d8", level: 60  },
  { id: "r-modo",    name: "moderateur",   label: "Modérateur",           color: "#e8912a", level: 50  },
  { id: "r-redac",   name: "redacteur",    label: "Rédacteur",            color: "#2ecc71", level: 40  },
  { id: "r-lecteur", name: "lecteur",      label: "Lecteur",              color: "#95a5a6", level: 10  },
];

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
