-- ═══════════════════════════════════════════════════════════════
-- Migration 002 — Connexion par pseudo (username → email lookup)
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Fonction sécurisée : résout un pseudo en email (via auth.users)
-- SECURITY DEFINER → s'exécute avec les droits du propriétaire
-- donc peut lire auth.users que l'anon ne peut pas lire directement.
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
  where p.username = p_username
  limit 1;
  return v_email;
end;
$$;

-- Autorise l'appel depuis le client anon (clé publique)
grant execute on function public.get_email_by_username(text) to anon;
grant execute on function public.get_email_by_username(text) to authenticated;
