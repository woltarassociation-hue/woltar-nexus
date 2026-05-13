import { supabase, withTimeout } from "./db.js";

// ── Lecture ────────────────────────────────────────────────────

export async function getPublishedPolls() {
  if (!supabase) return [];
  try {
    const { data, error } = await withTimeout(
      supabase
        .from("polls")
        .select("*, poll_votes(option_idx, voter_id)")
        .eq("status", "published")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
    );
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("[polls] getPublishedPolls failed:", err.message);
    return [];
  }
}

export async function getAllPolls() {
  if (!supabase) return [];
  try {
    const { data, error } = await withTimeout(
      supabase
        .from("polls")
        .select("*, poll_votes(option_idx, voter_id)")
        .order("created_at", { ascending: false })
    );
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("[polls] getAllPolls failed:", err.message);
    return [];
  }
}

// ── Création / édition ─────────────────────────────────────────

export async function createPoll({ title, description, options, allowMulti, expiresAt, createdBy }) {
  if (!supabase) return { poll: null, error: "Supabase non configuré." };
  const { data, error } = await supabase
    .from("polls")
    .insert([{
      title,
      description: description || "",
      options: options.map((o, i) => ({ idx: i, label: o })),
      allow_multi: allowMulti || false,
      expires_at: expiresAt || null,
      created_by: createdBy || null,
      status: "draft",
    }])
    .select()
    .single();
  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

export async function updatePollStatus(pollId, status) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("polls")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", pollId);
  return !error;
}

export async function togglePollPin(pollId, isPinned) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("polls")
    .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
    .eq("id", pollId);
  return !error;
}

export async function deletePoll(pollId) {
  if (!supabase) return false;
  const { error } = await supabase.from("polls").delete().eq("id", pollId);
  return !error;
}

// ── Vote ───────────────────────────────────────────────────────

export async function castVote(pollId, optionIdx, voterId, voterPseudo) {
  if (!supabase) return { success: false, error: "Supabase non configuré." };
  const { error } = await supabase.from("poll_votes").insert([{
    poll_id:      pollId,
    option_idx:   optionIdx,
    voter_id:     voterId || null,
    voter_pseudo: voterPseudo || null,
  }]);
  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export function hasVoted(poll, voterId) {
  if (!voterId || !poll.poll_votes) return false;
  return poll.poll_votes.some((v) => v.voter_id === voterId);
}

// ── Calcul résultats ───────────────────────────────────────────

export function computeResults(poll) {
  const votes = poll.poll_votes || [];
  const total = votes.length;
  return (poll.options || []).map((opt, i) => {
    const count = votes.filter((v) => v.option_idx === i).length;
    return {
      ...opt,
      idx:   i,
      count,
      pct:   total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}

// ── Expiration automatique ─────────────────────────────────────

export function isPollExpired(poll) {
  if (!poll.expires_at) return false;
  return new Date(poll.expires_at) < new Date();
}
