import { supabase, withTimeout } from "./db.js";

let _badges     = null;
let _userBadges = null;

function dispatch() { window.dispatchEvent(new Event("woltar:badges")); }

export function getBadges()     { return _badges     ?? []; }
export function getUserBadges() { return _userBadges ?? []; }

// Returns full user_badge objects (including badge_context) for a profile
export function getProfileUserBadges(profileId) {
  return getUserBadges().filter((ub) => ub.profile_id === profileId);
}

// Backward compat — IDs only
export function getBadgeIdsForProfile(profileId) {
  return getProfileUserBadges(profileId).map((ub) => ub.badge_id);
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

// newBadges: Array<{ badge_id: string, badge_context?: string | null }>
export async function saveProfileBadges(profileId, newBadges) {
  if (!supabase) return { ok: false, error: "Supabase non configuré" };
  try {
    const current    = getProfileUserBadges(profileId);
    const currentIds = current.map((ub) => ub.badge_id);
    const newIds     = newBadges.map((b) => b.badge_id);

    const toRemove = currentIds.filter((id) => !newIds.includes(id));

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
    if (newBadges.length > 0) {
      ops.push(
        withTimeout(
          supabase.from("user_badges").upsert(
            newBadges.map((b) => ({
              profile_id:    profileId,
              badge_id:      b.badge_id,
              badge_context: b.badge_context?.trim() || null,
            }))
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
