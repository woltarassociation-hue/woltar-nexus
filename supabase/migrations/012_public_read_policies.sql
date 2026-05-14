-- ============================================================
-- Woltar Nexus · Migration 012
-- Policies de lecture publique (anon) pour profils publics
--
-- Ré-exécutable. Ne supprime aucune donnée.
-- Requis pour /profil/:username accessible sans authentification.
-- ============================================================


-- 1. Activer RLS si pas déjà fait (idempotent via IF NOT EXISTS)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'profiles' AND n.nspname = 'public' AND c.relrowsecurity
  ) THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'badges' AND n.nspname = 'public' AND c.relrowsecurity
  ) THEN
    ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'user_badges' AND n.nspname = 'public' AND c.relrowsecurity
  ) THEN
    ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;


-- 2. Profils — lecture publique (anon + authenticated)
--    Les profils verrouillés (association) restent visibles : locked = protection admin, pas confidentialité.
DROP POLICY IF EXISTS "profiles_read_public" ON public.profiles;
CREATE POLICY "profiles_read_public"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);


-- 3. Badges — lecture publique (catalogue de badges)
DROP POLICY IF EXISTS "badges_read_public" ON public.badges;
CREATE POLICY "badges_read_public"
  ON public.badges FOR SELECT
  TO anon
  USING (true);

-- Policy authenticated si absente
DROP POLICY IF EXISTS "badges_read_authenticated" ON public.badges;
CREATE POLICY "badges_read_authenticated"
  ON public.badges FOR SELECT
  TO authenticated
  USING (true);


-- 4. User badges — lecture publique (badges attribués aux profils)
DROP POLICY IF EXISTS "user_badges_read_public" ON public.user_badges;
CREATE POLICY "user_badges_read_public"
  ON public.user_badges FOR SELECT
  TO anon
  USING (true);


-- Vérification post-migration
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'badges', 'user_badges')
ORDER BY tablename, policyname;
