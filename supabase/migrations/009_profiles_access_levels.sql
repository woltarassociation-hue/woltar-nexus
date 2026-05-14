-- ============================================================
-- Woltar Nexus · Migration 009
-- Refonte niveaux d'accès profils
--
-- Ré-exécutable dans le SQL Editor Supabase.
-- Ne supprime aucune donnée ni table existante.
--
-- Séquence :
--   1. Désactivation du trigger protect_profile_role
--   2. Contrainte transitoire (anciens + nouveaux niveaux)
--   3. Migration des anciens rôles vers les nouveaux niveaux
--   4. Contrainte finale (nouveaux niveaux uniquement)
--   5. Colonne profiles.locked
--   6. Verrouillage du compte association
--   7. Correction de is_woltar_admin()
--   8. Rétablissement d'un trigger allégé
--   9. Correction de handle_new_user() (visiteur par défaut)
--  10. Correction de la policy d'insertion profil
-- ============================================================


-- ============================================================
-- 1. Désactiver le trigger protect_profile_role
--    AVANT toute modification de la colonne role.
--    Raison : le trigger appelle is_woltar_admin() qui vérifie
--    auth.uid(), lequel est NULL dans le SQL Editor → bloque
--    le UPDATE de migration.
-- ============================================================

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;


-- ============================================================
-- 2. Contrainte transitoire — accepte anciens ET nouveaux
--    niveaux pour ne pas bloquer les lignes existantes pendant
--    la migration.
-- ============================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN (
    -- Nouveaux niveaux communautaires
    'visiteur', 'joueur', 'communication', 'dev',
    'artiste', 'journaliste', 'interim', 'administrateur',
    -- Anciens rôles (compatibilité transitoire)
    'admin', 'super_admin', 'membre', 'lecteur',
    'charge_com', 'redacteur', 'custom',
    'animateur_rp', 'moderateur'
  ));


-- ============================================================
-- 3. Migration des anciens rôles vers les nouveaux niveaux
--    WHERE ciblé : ne touche que les lignes avec un ancien rôle.
--    Ré-exécutable : si déjà migré, aucune ligne correspond.
-- ============================================================

UPDATE public.profiles
SET role = CASE role
  WHEN 'super_admin'  THEN 'administrateur'
  WHEN 'admin'        THEN 'administrateur'
  WHEN 'membre'       THEN 'joueur'
  WHEN 'lecteur'      THEN 'visiteur'
  WHEN 'charge_com'   THEN 'communication'
  WHEN 'redacteur'    THEN 'journaliste'
  WHEN 'custom'       THEN 'interim'
  WHEN 'animateur_rp' THEN 'interim'
  WHEN 'moderateur'   THEN 'interim'
  ELSE role
END
WHERE role IN (
  'super_admin', 'admin', 'membre', 'lecteur',
  'charge_com', 'redacteur', 'custom',
  'animateur_rp', 'moderateur'
);


-- ============================================================
-- 4. Contrainte finale — nouveaux niveaux uniquement
--    Posée après le UPDATE : toutes les lignes ont un niveau
--    valide, la contrainte ne peut pas échouer.
-- ============================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN (
    'visiteur', 'joueur', 'communication', 'dev',
    'artiste', 'journaliste', 'interim', 'administrateur'
  ));


-- ============================================================
-- 5. Colonne profiles.locked
--    Protège les comptes critiques (ex : association) contre
--    toute rétrogradation ou suppression via le dashboard.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false;


-- ============================================================
-- 6. Verrouillage du compte association
--    Ré-exécutable : SET est idempotent.
-- ============================================================

UPDATE public.profiles
SET
  locked = true,
  role   = 'administrateur',
  updated_at = now()
WHERE
  username = 'association'
  OR id IN (
    SELECT id FROM auth.users
    WHERE email IN ('association@woltar.nexus', 'association@woltar.net')
    LIMIT 1
  );


-- ============================================================
-- 7. Correction de is_woltar_admin()
--    Version précédente (migration 007) vérifiait 'admin' et
--    'super_admin' — désormais obsolètes.
--    Version 008 vérifiait 'administrateur' et 'dev' — correct,
--    mais posée AVANT le UPDATE → les profils encore à 'admin'
--    n'étaient pas reconnus.
--    Cette version est la référence stable.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_woltar_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('administrateur', 'dev')
  );
$$;


-- ============================================================
-- 8. Trigger de protection allégé
--    Remplace l'ancien trigger qui bloquait les migrations SQL
--    (car auth.uid() = NULL en contexte SQL Editor).
--
--    Nouvelle logique :
--    - Si auth.uid() IS NULL (contexte migration) → laisser passer.
--    - Si un profil locked = true, seul un admin peut changer
--      son niveau d'accès ou le déverrouiller.
--    - Toujours mettre à jour updated_at.
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Contexte migration (SQL Editor) : auth.uid() est NULL → autoriser.
  IF auth.uid() IS NULL THEN
    NEW.updated_at = now();
    RETURN NEW;
  END IF;

  -- Empêcher le changement de niveau d'accès sur un profil verrouillé.
  IF OLD.locked = true
    AND OLD.role IS DISTINCT FROM NEW.role
    AND NOT public.is_woltar_admin()
  THEN
    RAISE EXCEPTION 'Impossible de modifier le niveau d''accès d''un profil verrouillé.';
  END IF;

  -- Empêcher le déverrouillage d'un profil verrouillé sans droits admin.
  IF OLD.locked = true AND NEW.locked = false AND NOT public.is_woltar_admin() THEN
    RAISE EXCEPTION 'Ce profil est verrouillé et ne peut être déverrouillé que par un administrateur.';
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;

CREATE TRIGGER protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();


-- ============================================================
-- 9. Correction du trigger handle_new_user
--    Ancienne version : role = 'membre' (valeur supprimée).
--    Nouvelle version : role = 'visiteur' (niveau d'accès minimal).
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_username text;
BEGIN
  clean_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(new.email, '@', 1)
  );

  INSERT INTO public.profiles (id, username, name, display_name, role)
  VALUES (
    new.id,
    clean_username,
    clean_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), clean_username),
    'visiteur'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    username     = excluded.username,
    name         = coalesce(public.profiles.name, excluded.name),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at   = now();

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 10. Correction de la policy d'insertion profil
--     Ancienne version (migration 006) : role = 'membre' → bloquait
--     les nouvelles inscriptions (contrainte finale refuse 'membre').
--     Ancienne version (migration 008) : role = 'visiteur' → correct
--     mais posée avant la contrainte finale dans 008 → conflit.
--     Cette version est la référence stable.
-- ============================================================

DROP POLICY IF EXISTS "profiles_insert_own_member" ON public.profiles;

CREATE POLICY "profiles_insert_own_member"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'visiteur');


-- ============================================================
-- Vérification post-migration (à lire dans les résultats)
-- ============================================================

SELECT
  role,
  count(*)        AS nb_profils,
  count(*) FILTER (WHERE locked = true) AS nb_locked
FROM public.profiles
GROUP BY role
ORDER BY role;
