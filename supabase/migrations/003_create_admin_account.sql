-- ═══════════════════════════════════════════════════════════════
-- Migration 003 — Création du compte administrateur
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════
--
-- Remplacez 'VOTRE_MOT_DE_PASSE_FORT' par le vrai mot de passe.
-- Le pseudo "Administrateur" dérive en email : administrateur@woltar.nexus
--
-- ⚠ Ne commitez jamais ce fichier avec un vrai mot de passe.
-- ═══════════════════════════════════════════════════════════════

-- 1. Créer l'utilisateur dans Supabase Auth (email dérivé du pseudo)
select auth.create_user(
  '{"email": "administrateur@woltar.nexus", "password": "VOTRE_MOT_DE_PASSE_FORT", "email_confirm": true}'::jsonb
);

-- 2. Mettre le rôle admin sur le profil auto-créé par le trigger
update public.profiles
set role = 'super_admin',
    username = 'Administrateur',
    display_name = 'Administrateur'
where id = (
  select id from auth.users where email = 'administrateur@woltar.nexus'
);

-- ── Alternative : si vous voulez un pseudo différent ──────────
-- Changez 'Administrateur' dans les deux endroits ci-dessus.
-- L'email dérivé suit la règle : lowercase + remplace tout ce qui
-- n'est pas a-z 0-9 . _ - par un underscore, puis @woltar.nexus
-- Ex: "Wolf Tar" → "wolf_tar@woltar.nexus"
-- ─────────────────────────────────────────────────────────────
