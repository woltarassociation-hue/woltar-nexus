-- ============================================================
-- Woltar Nexus · Migration 013
-- Hardening profils d'accès / RLS
--
-- Objectif :
-- - profiles.role reste modifiable uniquement par un admin
-- - profiles.locked reste modifiable uniquement par un admin
-- - les mises à jour de profil standards continuent de fonctionner
-- - les migrations SQL restent possibles via auth.uid() IS NULL
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


CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    NEW.updated_at = now();
    RETURN NEW;
  END IF;

  IF OLD.role IS DISTINCT FROM NEW.role
    AND NOT public.is_woltar_admin()
  THEN
    RAISE EXCEPTION 'Seuls les administrateurs Woltar peuvent modifier le profil d''accès.';
  END IF;

  IF OLD.locked IS DISTINCT FROM NEW.locked
    AND NOT public.is_woltar_admin()
  THEN
    RAISE EXCEPTION 'Seuls les administrateurs Woltar peuvent modifier le verrouillage d''un profil.';
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;

CREATE TRIGGER protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();


SELECT
  role,
  count(*) AS nb_profils,
  count(*) FILTER (WHERE locked = true) AS nb_locked
FROM public.profiles
GROUP BY role
ORDER BY role;
