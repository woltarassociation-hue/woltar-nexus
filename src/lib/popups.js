import { supabase, withTimeout } from "./db.js";

export async function getActiveAnnouncement() {
  if (!supabase) return null;
  try {
    const now = new Date().toISOString();
    const { data, error } = await withTimeout(
      supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
        .or(`expires_at.is.null,expires_at.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    );
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getAllAnnouncements() {
  if (!supabase) return [];
  try {
    const { data, error } = await withTimeout(
      supabase.from("announcements").select("*").order("created_at", { ascending: false })
    );
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function upsertAnnouncement(ann) {
  if (!supabase) return { data: null, error: "Supabase non configuré." };
  const record = {
    ...ann,
    updated_at: new Date().toISOString(),
  };
  if (!record.id) delete record.id;
  const { data, error } = await supabase
    .from("announcements")
    .upsert([record])
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deleteAnnouncement(id) {
  if (!supabase) return false;
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  return !error;
}

export async function toggleAnnouncement(id, isActive) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("announcements")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}
