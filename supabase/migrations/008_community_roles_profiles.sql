-- ============================================================
-- Woltar Nexus - Roles communautaires et profils publics
-- Re-executable dans Supabase SQL Editor
-- ============================================================

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists woltarien1 text not null default '';
alter table public.profiles add column if not exists woltarien2 text;
alter table public.profiles add column if not exists links jsonb not null default '{}';

alter table public.profiles alter column role set default 'visiteur';

update public.profiles
set role = case role
  when 'super_admin' then 'administrateur'
  when 'admin' then 'administrateur'
  when 'membre' then 'joueur'
  when 'lecteur' then 'visiteur'
  when 'charge_com' then 'communication'
  when 'redacteur' then 'journaliste'
  when 'custom' then 'interim'
  else role
end;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in (
    'visiteur',
    'joueur',
    'communication',
    'dev',
    'artiste',
    'journaliste',
    'interim',
    'administrateur'
  ));

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
      and role in ('administrateur', 'dev')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_username text;
begin
  clean_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, username, name, display_name, role)
  values (
    new.id,
    clean_username,
    clean_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), clean_username),
    'visiteur'
  )
  on conflict (id) do update
  set username = excluded.username,
      name = coalesce(public.profiles.name, excluded.name),
      display_name = coalesce(public.profiles.display_name, excluded.display_name),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "profiles_insert_own_member" on public.profiles;
create policy "profiles_insert_own_member"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and role = 'visiteur');

insert into public.roles (name, label, color, level) values
  ('visiteur',       'Visiteur',       '#7f8c8d', 5),
  ('joueur',         'Joueur',         '#1fa8dc', 10),
  ('communication',  'Communication',  '#2ecc71', 50),
  ('dev',            'Dev',            '#a865d8', 90),
  ('artiste',        'Artiste',        '#e891ff', 35),
  ('journaliste',    'Journaliste',    '#f1c40f', 35),
  ('interim',        'Interim',        '#e8912a', 60),
  ('administrateur', 'Administrateur', '#ff4444', 100)
on conflict (name) do update
set label = excluded.label,
    color = excluded.color,
    level = excluded.level;

insert into public.permissions (key, label, group_name) values
  ('view_profile',      'Voir son profil',       'Profil'),
  ('edit_profile',      'Modifier son profil',   'Profil'),
  ('vote_poll',         'Voter aux sondages',    'Sondages'),
  ('access_dashboard',  'Acceder au dashboard',  'Acces'),
  ('access_studio',     'Acceder au Studio',     'Acces'),
  ('manage_content',    'Gerer le contenu',      'Studio'),
  ('manage_media',      'Gerer la mediatheque',  'Media'),
  ('create_fanarts',    'Publier fan-arts',      'Studio'),
  ('publish_fanarts',   'Mettre en ligne fan-arts', 'Studio'),
  ('create_actualites', 'Publier actualites',    'Studio'),
  ('publish_actualites','Mettre en ligne actualites', 'Studio'),
  ('manage_users',      'Gerer les utilisateurs','Admin'),
  ('manage_settings',   'Gerer les parametres',  'Admin')
on conflict (key) do update
set label = excluded.label,
    group_name = excluded.group_name;

with role_perm(role_name, perm_key) as (
  values
    ('visiteur', 'view_profile'),
    ('joueur', 'view_profile'),
    ('joueur', 'edit_profile'),
    ('joueur', 'vote_poll'),
    ('communication', 'view_profile'),
    ('communication', 'edit_profile'),
    ('communication', 'access_dashboard'),
    ('communication', 'access_studio'),
    ('communication', 'manage_content'),
    ('communication', 'manage_media'),
    ('artiste', 'view_profile'),
    ('artiste', 'edit_profile'),
    ('artiste', 'access_dashboard'),
    ('artiste', 'access_studio'),
    ('artiste', 'create_fanarts'),
    ('artiste', 'publish_fanarts'),
    ('journaliste', 'view_profile'),
    ('journaliste', 'edit_profile'),
    ('journaliste', 'access_dashboard'),
    ('journaliste', 'access_studio'),
    ('journaliste', 'create_actualites'),
    ('journaliste', 'publish_actualites'),
    ('interim', 'view_profile'),
    ('interim', 'edit_profile'),
    ('interim', 'access_dashboard'),
    ('interim', 'access_studio')
)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from role_perm rp
join public.roles r on r.name = rp.role_name
join public.permissions p on p.key = rp.perm_key
on conflict do nothing;

-- Promotion du compte association vers le nouveau role complet.
update public.profiles
set role = 'administrateur',
    username = 'association',
    display_name = coalesce(display_name, 'Administrateur'),
    name = coalesce(name, 'Administrateur'),
    updated_at = now()
where id = (
  select id from auth.users where email in (
    'association@woltar.nexus',
    'association@woltar.net'
  )
  limit 1
);
