import { supabase, withTimeout } from "./db.js";

export async function fetchDashboardStats() {
  if (!supabase) return null;
  try {
    const [
      articles,
      tickets,
      members,
      polls,
      events,
      forms,
    ] = await Promise.all([
      withTimeout(supabase.from("articles").select("id,status,created_at", { count: "exact" })),
      withTimeout(supabase.from("tickets").select("id,status", { count: "exact" })),
      withTimeout(supabase.from("members").select("id,created_at", { count: "exact" })),
      withTimeout(supabase.from("polls").select("id,status,poll_votes(id)")),
      withTimeout(supabase.from("articles").select("id").eq("category", "evenements")),
      withTimeout(supabase.from("forms").select("id,status")),
    ]);

    const articlesData  = articles.data  || [];
    const ticketsData   = tickets.data   || [];
    const membersData   = members.data   || [];
    const pollsData     = polls.data     || [];
    const eventsData    = events.data    || [];
    const formsData     = forms.data     || [];

    // Stats articles
    const publishedArticles = articlesData.filter((a) => a.status === "published").length;
    const draftArticles     = articlesData.filter((a) => a.status === "draft").length;

    // Stats tickets
    const openTickets = ticketsData.filter((t) =>
      ["Ouvert", "En cours"].includes(t.status)
    ).length;

    // Stats membres
    const totalMembers = membersData.length;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const newMembersThisMonth = membersData.filter(
      (m) => m.created_at > thirtyDaysAgo
    ).length;

    // Stats sondages
    const activePollsCount = pollsData.filter((p) => p.status === "published").length;
    const totalVotes = pollsData.reduce(
      (acc, p) => acc + (p.poll_votes?.length || 0), 0
    );

    // Stats événements
    const activeEvents = eventsData.length;

    // Stats formulaires
    const openForms = formsData.filter((f) => f.status === "published").length;

    return {
      articles: {
        total:     articlesData.length,
        published: publishedArticles,
        draft:     draftArticles,
      },
      tickets: {
        total: ticketsData.length,
        open:  openTickets,
      },
      members: {
        total:        totalMembers,
        newThisMonth: newMembersThisMonth,
      },
      polls: {
        active:     activePollsCount,
        totalVotes,
      },
      events: {
        active: activeEvents,
      },
      forms: {
        open: openForms,
      },
    };
  } catch (err) {
    console.warn("[stats] fetchDashboardStats failed:", err.message);
    return null;
  }
}
