import { supabase, withTimeout } from "./db.js";

let _badges     = null;
let _userBadges = null;

function dispatch() { window.dispatchEvent(new Event("woltar:badges")); }

export function getBadges()     { return _badges     ?? []; }
export function getUserBadges() { return _userBadges ?? []; }

export function getBadgeIdsForProfile(profileId) {
  return getUserBadges()
    .filter((ub) => ub.profile_id === profileId)
    .map((ub) => ub.badge_id);
}

async function loadAll() {
  if (!supabase) return;
  try {
    const [bRes, ubRes] = await Promise.all([
      withTimeout(supabase.from("badges").select("*").order("name")),
      withTimeout(supabase.from("user_badges").select("*")),
    ]);
    if (!bRes.error)  _badges     = bRes.data  ?? [];
    if (!ubRes.error) _userBadges = ubRes.data ?? [];
    dispatch();
  } catch (err) {
    console.warn("[badges] loadAll failed:", err.message);
  }
}

if (supabase) loadAll();

export async function saveProfileBadges(profileId, newBadgeIds) {
  if (!supabase) return { ok: false, error: "Supabase non configuré" };
  try {
    const current = getBadgeIdsForProfile(profileId);
    const toAdd    = newBadgeIds.filter((id) => !current.includes(id));
    const toRemove = current.filter((id) => !newBadgeIds.includes(id));

    const ops = [];
    if (toRemove.length > 0) {
      ops.push(
        withTimeout(
          supabase.from("user_badges").delete()
            .eq("profile_id", profileId)
            .in("badge_id", toRemove)
        )
      );
    }
    if (toAdd.length > 0) {
      ops.push(
        withTimeout(
          supabase.from("user_badges").upsert(
            toAdd.map((badge_id) => ({ profile_id: profileId, badge_id }))
          )
        )
      );
    }

    const results = await Promise.all(ops);
    const failed  = results.find((r) => r.error);
    if (failed) throw new Error(failed.error.message);

    await loadAll();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
