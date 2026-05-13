-- ═══════════════════════════════════════════════════════════════
-- Migration 001 — Table profiles liée à Supabase Auth
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Table profiles
create table if not exists public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  username      text        unique,
  display_name  text,
  role          text        not null default 'lecteur'
                            check (role in (
                              'super_admin', 'admin',
                              'charge_com', 'animateur_rp',
                              'moderateur', 'redacteur', 'lecteur'
                            )),
  avatar_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2. Row Level Security
alter table public.profiles enable row level security;

-- Tout le monde peut lire les profils (pseudo, rôle affiché)
create policy "Profils publics lisibles"
  on public.profiles for select
  using (true);

-- Seul l'utilisateur peut modifier son propre profil
create policy "Utilisateur modifie son profil"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Trigger : créer automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'display_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Pour définir un admin manuellement ──────────────────────
-- Après avoir créé un compte via /login, exécutez dans SQL Editor :
--
--   update public.profiles
--   set role = 'admin'
--   where id = '<uuid-de-l-utilisateur>';
--
-- L'UUID se trouve dans Authentication → Users dans le dashboard Supabase.
-- ────────────────────────────────────────────────────────────
