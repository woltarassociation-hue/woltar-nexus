-- ============================================================
-- Woltar Nexus - Alignement Auth Supabase / profiles
-- Re-executable dans Supabase SQL Editor
-- ============================================================

create extension if not exists pgcrypto;

-- Nettoyage des anciens champs dangereux : aucun mot de passe applicatif.
alter table if exists public.profiles drop column if exists password;
alter table if exists public.members drop column if exists password;

-- profiles est la source fiable de l'identite visible.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  name         text,
  display_name text,
  role         text not null default 'membre',
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Si une ancienne table profiles existait avec id en text, ne garder que les
-- lignes liees a Supabase Auth avant conversion en uuid.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
      and data_type <> 'uuid'
  ) then
    delete from public.profiles
    where id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    alter table public.profiles
      alter column id type uuid using id::uuid;
  end if;
end $$;

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists role text not null default 'membre';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_id_auth_users_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_id_auth_users_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_key'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_key unique (username);
  end if;
end $$;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in (
    'membre',
    'super_admin',
    'admin',
    'charge_com',
    'animateur_rp',
    'moderateur',
    'redacteur',
    'lecteur',
    'artiste',
    'communication',
    'custom'
  ));

-- members reste une table communautaire optionnelle, liee a Auth si besoin.
create table if not exists public.members (
  id         text primary key,
  pseudo     text unique,
  role       text not null default 'membre',
  avatar     text,
  auth_id    uuid unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.members add column if not exists auth_id uuid unique references auth.users(id) on delete cascade;

-- Helpers RLS.
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

-- Trigger Auth -> profiles : inscription pseudo@woltar.nexus, profil membre.
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
    'membre'
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

-- RLS profiles : visibles aux membres connectes, modification encadree.
alter table public.profiles enable row level security;

drop policy if exists "anon_all_profiles" on public.profiles;
drop policy if exists "Profils publics lisibles" on public.profiles;
drop policy if exists "Utilisateur modifie son profil" on public.profiles;
drop policy if exists "profiles_read_authenticated" on public.profiles;
drop policy if exists "profiles_insert_own_member" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;

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

-- RLS members : pas de mot de passe, lecture reservee aux connectes.
alter table public.members enable row level security;

drop policy if exists "anon_all_members" on public.members;
drop policy if exists "members_read_authenticated" on public.members;
drop policy if exists "members_write_admin" on public.members;

create policy "members_read_authenticated"
  on public.members for select
  to authenticated
  using (true);

create policy "members_write_admin"
  on public.members for all
  to authenticated
  using (public.is_woltar_admin())
  with check (public.is_woltar_admin());

-- RPC optionnelle : resolution pseudo -> email technique.
create or replace function public.get_email_by_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select u.email into v_email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(trim(p_username))
  limit 1;

  return v_email;
end;
$$;

grant execute on function public.get_email_by_username(text) to anon;
grant execute on function public.get_email_by_username(text) to authenticated;

-- Realtime : re-executable.
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.members;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- Promotion du compte association si l'utilisateur Auth existe deja.
-- Creer d'abord le user dans Authentication avec :
--   email: association@woltar.nexus
--   password: woltar2026
--   email confirmed: true
insert into public.profiles (id, username, name, display_name, role)
select id, 'association', 'Administrateur', 'Administrateur', 'admin'
from auth.users
where email = 'association@woltar.nexus'
on conflict (id) do update
set username = excluded.username,
    name = excluded.name,
    display_name = excluded.display_name,
    role = excluded.role,
    updated_at = now();
