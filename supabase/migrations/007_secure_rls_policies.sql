-- ============================================================
-- Woltar Nexus - RLS securisees et re-executables
-- ============================================================

-- Helper admin commun a toutes les policies d'ecriture.
create or replace function public.is_woltar_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

-- Protection des roles : seul un admin peut changer role/super_admin/admin.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and not public.is_woltar_admin() then
    raise exception 'Only Woltar admins can change profile roles';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ============================================================
-- Nettoyage des anciennes policies trop ouvertes
-- ============================================================

drop policy if exists "anon_all_articles" on public.articles;
drop policy if exists "anon_all_forms" on public.forms;
drop policy if exists "anon_all_form_responses" on public.form_responses;
drop policy if exists "anon_all_tickets" on public.tickets;
drop policy if exists "anon_all_profiles" on public.profiles;
drop policy if exists "anon_all_members" on public.members;
drop policy if exists "anon_all_candidatures" on public.candidatures;
drop policy if exists "anon_all_event_highlights" on public.event_highlights;

drop policy if exists "anon_read_settings" on public.site_settings;
drop policy if exists "anon_write_settings" on public.site_settings;
drop policy if exists "anon_read_cat" on public.categories;
drop policy if exists "anon_write_cat" on public.categories;
drop policy if exists "anon_read_roles" on public.roles;
drop policy if exists "anon_write_roles" on public.roles;
drop policy if exists "anon_read_perms" on public.permissions;
drop policy if exists "anon_write_perms" on public.permissions;
drop policy if exists "anon_read_rp" on public.role_permissions;
drop policy if exists "anon_write_rp" on public.role_permissions;
drop policy if exists "anon_read_ur" on public.user_roles;
drop policy if exists "anon_write_ur" on public.user_roles;
drop policy if exists "anon_read_media" on public.media;
drop policy if exists "anon_write_media" on public.media;
drop policy if exists "anon_read_badges" on public.badges;
drop policy if exists "anon_write_badges" on public.badges;
drop policy if exists "anon_read_ub" on public.user_badges;
drop policy if exists "anon_write_ub" on public.user_badges;
drop policy if exists "anon_read_bm" on public.bookmarks;
drop policy if exists "anon_write_bm" on public.bookmarks;
drop policy if exists "anon_read_comments" on public.comments;
drop policy if exists "anon_write_comments" on public.comments;
drop policy if exists "anon_read_notif" on public.notifications;
drop policy if exists "anon_write_notif" on public.notifications;
drop policy if exists "anon_read_ep" on public.event_participants;
drop policy if exists "anon_write_ep" on public.event_participants;
drop policy if exists "anon_read_tm" on public.ticket_messages;
drop policy if exists "anon_write_tm" on public.ticket_messages;

drop policy if exists "anon_read_polls" on public.polls;
drop policy if exists "auth_read_polls" on public.polls;
drop policy if exists "auth_write_polls" on public.polls;
drop policy if exists "anon_read_poll_votes" on public.poll_votes;
drop policy if exists "auth_write_poll_votes" on public.poll_votes;

drop policy if exists "anon_read_ann" on public.announcements;
drop policy if exists "auth_all_ann" on public.announcements;
drop policy if exists "anon_read_announcements" on public.announcements;
drop policy if exists "anon_write_announcements" on public.announcements;

drop policy if exists "Profils publics lisibles" on public.profiles;
drop policy if exists "Utilisateur modifie son profil" on public.profiles;
drop policy if exists "profiles_read_authenticated" on public.profiles;
drop policy if exists "profiles_insert_own_member" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "members_read_authenticated" on public.members;
drop policy if exists "members_write_admin" on public.members;

-- ============================================================
-- Activation RLS
-- ============================================================

alter table public.articles enable row level security;
alter table public.forms enable row level security;
alter table public.form_responses enable row level security;
alter table public.tickets enable row level security;
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.candidatures enable row level security;
alter table public.event_highlights enable row level security;
alter table public.site_settings enable row level security;
alter table public.categories enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.media enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.bookmarks enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.event_participants enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;
alter table public.announcements enable row level security;

-- ============================================================
-- Contenu public : lecture publique, ecriture admin
-- ============================================================

create policy "articles_read_published"
  on public.articles for select
  to anon, authenticated
  using (status = 'published');

create policy "articles_admin_all"
  on public.articles for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "forms_read_published"
  on public.forms for select
  to anon, authenticated
  using (status = 'published');

create policy "forms_admin_all"
  on public.forms for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "event_highlights_read_public"
  on public.event_highlights for select
  to anon, authenticated
  using (true);

create policy "event_highlights_admin_all"
  on public.event_highlights for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "announcements_read_active"
  on public.announcements for select
  to anon, authenticated
  using (is_active = true);

create policy "announcements_admin_all"
  on public.announcements for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "categories_read_public"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "categories_admin_all"
  on public.categories for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "settings_read_public"
  on public.site_settings for select
  to anon, authenticated
  using (true);

create policy "settings_admin_all"
  on public.site_settings for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "media_read_public"
  on public.media for select
  to anon, authenticated
  using (true);

create policy "media_admin_all"
  on public.media for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

-- ============================================================
-- Tickets, formulaires, candidatures : creation publique,
-- lecture et traitement reserves aux admins.
-- ============================================================

create policy "form_responses_insert_public"
  on public.form_responses for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.forms
      where forms.id = form_responses.form_id
        and forms.status = 'published'
    )
  );

create policy "form_responses_admin_all"
  on public.form_responses for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "tickets_insert_public"
  on public.tickets for insert
  to anon, authenticated
  with check (true);

create policy "tickets_admin_all"
  on public.tickets for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "candidatures_insert_public"
  on public.candidatures for insert
  to anon, authenticated
  with check (true);

create policy "candidatures_admin_all"
  on public.candidatures for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "ticket_messages_insert_public"
  on public.ticket_messages for insert
  to anon, authenticated
  with check (true);

create policy "ticket_messages_admin_all"
  on public.ticket_messages for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

-- ============================================================
-- Profils et membres
-- ============================================================

create policy "profiles_read_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own_member"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and role = 'membre');

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_admin_all"
  on public.profiles for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "members_read_authenticated"
  on public.members for select
  to authenticated
  using (true);

create policy "members_admin_all"
  on public.members for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

-- ============================================================
-- Roles, permissions, badges et donnees utilisateur
-- ============================================================

create policy "roles_read_authenticated"
  on public.roles for select
  to authenticated
  using (true);

create policy "roles_admin_all"
  on public.roles for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "permissions_read_authenticated"
  on public.permissions for select
  to authenticated
  using (true);

create policy "permissions_admin_all"
  on public.permissions for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "role_permissions_read_authenticated"
  on public.role_permissions for select
  to authenticated
  using (true);

create policy "role_permissions_admin_all"
  on public.role_permissions for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "user_roles_read_authenticated"
  on public.user_roles for select
  to authenticated
  using (true);

create policy "user_roles_admin_all"
  on public.user_roles for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "badges_read_public"
  on public.badges for select
  to anon, authenticated
  using (true);

create policy "badges_admin_all"
  on public.badges for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "user_badges_read_authenticated"
  on public.user_badges for select
  to authenticated
  using (true);

create policy "user_badges_admin_all"
  on public.user_badges for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "bookmarks_own_all"
  on public.bookmarks for all
  to authenticated
  using (profile_id = auth.uid() or public.is_woltar_admin())
  with check (profile_id = auth.uid() or public.is_woltar_admin());

create policy "notifications_own_read"
  on public.notifications for select
  to authenticated
  using (profile_id = auth.uid() or public.is_woltar_admin());

create policy "notifications_admin_all"
  on public.notifications for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

-- ============================================================
-- Commentaires et participations publiques encadrees
-- ============================================================

create policy "comments_read_approved"
  on public.comments for select
  to anon, authenticated
  using (is_approved = true or public.is_woltar_admin());

create policy "comments_insert_public"
  on public.comments for insert
  to anon, authenticated
  with check (true);

create policy "comments_admin_all"
  on public.comments for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "event_participants_insert_public"
  on public.event_participants for insert
  to anon, authenticated
  with check (true);

create policy "event_participants_admin_all"
  on public.event_participants for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

-- ============================================================
-- Sondages : lecture publique des publies, vote public,
-- gestion admin.
-- ============================================================

create policy "polls_read_published"
  on public.polls for select
  to anon, authenticated
  using (status = 'published' or public.is_woltar_admin());

create policy "polls_admin_all"
  on public.polls for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

create policy "poll_votes_read_published"
  on public.poll_votes for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.polls
      where polls.id = poll_votes.poll_id
        and polls.status = 'published'
    )
    or public.is_woltar_admin()
  );

create policy "poll_votes_insert_public"
  on public.poll_votes for insert
  to anon, authenticated
  with check (
    (voter_id is null or voter_id = auth.uid())
    and exists (
      select 1
      from public.polls
      where polls.id = poll_votes.poll_id
        and polls.status = 'published'
        and (polls.expires_at is null or polls.expires_at > now())
    )
  );

create policy "poll_votes_admin_all"
  on public.poll_votes for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());
