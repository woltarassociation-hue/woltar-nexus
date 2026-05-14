-- ============================================================
-- Woltar Nexus · Migration 016
-- Vérification RLS lecture badges/user_badges pour authenticated
--
-- Idempotent. Ne modifie pas les droits d'écriture.
-- ============================================================

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badges_read_authenticated" ON public.badges;
CREATE POLICY "badges_read_authenticated"
  ON public.badges FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "user_badges_read_authenticated" ON public.user_badges;
CREATE POLICY "user_badges_read_authenticated"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (true);

SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('badges', 'user_badges')
ORDER BY tablename, policyname;
