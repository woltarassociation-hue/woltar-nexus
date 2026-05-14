import { supabase, withTimeout } from "./db.js";
import { createActivity, createNotification } from "./social.js";

let _badges = null;
let _userBadges = null;

function dispatch() {
  window.dispatchEvent(new Event("woltar:badges"));
}

export function getBadges() {
  return _badges ?? [];
}

export function getUserBadges() {
  return _userBadges ?? [];
}

export function clearBadgesCache() {
  _badges = null;
  _userBadges = null;
  dispatch();
}

export function getProfileUserBadges(profileId) {
  return getUserBadges().filter((ub) => ub.profile_id === profileId);
}

export function getBadgeIdsForProfile(profileId) {
  return getProfileUserBadges(profileId).map((ub) => ub.badge_id);
}

function normalizeBadgeRow(row) {
  const name = row?.name || row?.label || "Badge";
  return {
    ...row,
    name,
    icon: row?.icon || "🏅",
    color: row?.color || "#6aa6ff",
    category: row?.category || "general",
    rarity: row?.rarity || "common",
    description: row?.description || "",
  };
}

async function loadAll() {
  if (!supabase) return;
  try {
    const [bRes, ubRes] = await Promise.all([
      withTimeout(supabase.from("badges").select("*").order("name")),
      withTimeout(supabase.from("user_badges").select("*")),
    ]);
    if (bRes.error) throw new Error(`badges: ${bRes.error.message}`);
    if (ubRes.error) throw new Error(`user_badges: ${ubRes.error.message}`);
    _badges = (bRes.data ?? []).map(normalizeBadgeRow);
    _userBadges = ubRes.data ?? [];
    dispatch();
    return { ok: true, badges: _badges, userBadges: _userBadges };
  } catch (err) {
    console.warn("[badges] loadAll failed:", err.message);
    return { ok: false, error: err.message };
  }
}

if (supabase) loadAll();

export async function reloadBadgesCache() {
  if (!supabase) {
    return { ok: false, error: "Supabase non configuré" };
  }
  return loadAll();
}

export async function saveProfileBadges(profileId, newBadges, options = {}) {
  if (!supabase) return { ok: false, error: "Supabase non configuré" };
  try {
    const current = getProfileUserBadges(profileId);
    const currentIds = current.map((ub) => ub.badge_id);
    const newIds = newBadges.map((b) => b.badge_id);
    const toRemove = currentIds.filter((id) => !newIds.includes(id));
    const toAdd = newIds.filter((id) => !currentIds.includes(id));

    const ops = [];
    if (toRemove.length > 0) {
      ops.push(
        withTimeout(
          supabase
            .from("user_badges")
            .delete()
            .eq("profile_id", profileId)
            .in("badge_id", toRemove)
        )
      );
    }
    if (newBadges.length > 0) {
      ops.push(
        withTimeout(
          supabase.from("user_badges").upsert(
            newBadges.map((b) => ({
              profile_id: profileId,
              badge_id: b.badge_id,
              badge_context: b.badge_context?.trim() || null,
            }))
          )
        )
      );
    }

    const results = await Promise.all(ops);
    const failed = results.find((r) => r.error);
    if (failed) throw new Error(failed.error.message);

    await loadAll();

    if (toAdd.length > 0) {
      await createActivity({
        profileId,
        type: "badge_received",
        message: `${toAdd.length} badge(s) attribué(s)`,
        metadata: { badge_ids: toAdd, actor_id: options.actorId || null },
      });
      await createNotification({
        profileId,
        type: "badge_received",
        title: "Nouveau badge",
        body: `Vous avez reçu ${toAdd.length} badge(s).`,
      });
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
