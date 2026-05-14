import { supabase, withTimeout } from "./db.js";

const RECENTLY_ACTIVE_MS = 15 * 60 * 1000;
const ONLINE_MS = 2 * 60 * 1000;

export function getPresenceStatus(lastSeenAt) {
  if (!lastSeenAt) return "offline";
  const ts = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(ts)) return "offline";
  const delta = Date.now() - ts;
  if (delta <= ONLINE_MS) return "online";
  if (delta <= RECENTLY_ACTIVE_MS) return "recent";
  return "offline";
}

export function getPresenceLabel(lastSeenAt) {
  const status = getPresenceStatus(lastSeenAt);
  if (status === "online") return "En ligne";
  if (status === "recent") return "Actif récemment";
  return "Hors ligne";
}

export async function touchPresence(profileId) {
  if (!supabase || !profileId) return;
  try {
    await withTimeout(
      supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", profileId)
    );
  } catch {
    // Non bloquant
  }
}

export async function createActivity({ profileId, type, message, metadata = null }) {
  if (!supabase || !profileId || !type) return;
  try {
    await withTimeout(
      supabase.from("activity_logs").insert({
        profile_id: profileId,
        activity_type: type,
        message: message || "",
        metadata: metadata || {},
      })
    );
  } catch {
    // Non bloquant
  }
}

export async function getRecentActivityForProfile(profileId, limit = 8) {
  if (!supabase || !profileId) return [];
  const { data, error } = await withTimeout(
    supabase
      .from("activity_logs")
      .select("id, profile_id, activity_type, message, metadata, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit)
  );
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getProfileComments(profileId, limit = 20) {
  if (!supabase || !profileId) return [];
  const { data, error } = await withTimeout(
    supabase
      .from("profile_comments")
      .select(`
        id,
        profile_id,
        author_id,
        content,
        created_at,
        author:profiles!profile_comments_author_id_fkey (id, username, display_name, avatar_url)
      `)
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit)
  );
  if (error) throw new Error(error.message);
  return data || [];
}

export async function addProfileComment({ profileId, authorId, content }) {
  if (!supabase) throw new Error("Supabase non configuré");
  const body = (content || "").trim();
  if (!profileId || !authorId || !body) throw new Error("Commentaire invalide");
  const { data, error } = await withTimeout(
    supabase
      .from("profile_comments")
      .insert({ profile_id: profileId, author_id: authorId, content: body })
      .select("id, profile_id, author_id, content, created_at")
      .single()
  );
  if (error) throw new Error(error.message);
  await createActivity({
    profileId,
    type: "profile_comment_received",
    message: "Nouveau commentaire reçu",
    metadata: { author_id: authorId },
  });
  if (profileId !== authorId) {
    await createNotification({
      profileId,
      type: "comment_received",
      title: "Nouveau commentaire",
      body: "Quelqu'un a commenté votre profil public.",
    });
  }
  return data;
}

export async function deleteProfileComment(commentId) {
  if (!supabase) throw new Error("Supabase non configuré");
  const { error } = await withTimeout(
    supabase.from("profile_comments").delete().eq("id", commentId)
  );
  if (error) throw new Error(error.message);
}

export async function getNotifications(profileId, limit = 20) {
  if (!supabase || !profileId) return [];
  const { data, error } = await withTimeout(
    supabase
      .from("notifications")
      .select("id, profile_id, type, title, body, is_read, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit)
  );
  if (error) throw new Error(error.message);
  return data || [];
}

export async function markNotificationRead(notificationId, isRead = true) {
  if (!supabase || !notificationId) return;
  const { error } = await withTimeout(
    supabase.from("notifications").update({ is_read: isRead }).eq("id", notificationId)
  );
  if (error) throw new Error(error.message);
}

export async function createNotification({ profileId, type = "info", title = "", body = "" }) {
  if (!supabase || !profileId) return;
  try {
    await withTimeout(
      supabase.from("notifications").insert({
        profile_id: profileId,
        type,
        title,
        body,
        is_read: false,
      })
    );
  } catch {
    // Non bloquant
  }
}
