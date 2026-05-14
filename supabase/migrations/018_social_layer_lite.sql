-- ============================================================
-- Woltar Nexus · Migration 018
-- Social layer léger : présence, activité, commentaires profil,
-- notifications basiques + RLS.
-- Idempotente / ré-exécutable.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  message text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_profile_created
  ON public.activity_logs(profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.profile_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_comments_profile_created
  ON public.profile_comments(profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'info';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS body text NOT NULL DEFAULT '';

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_logs_read_public" ON public.activity_logs;
CREATE POLICY "activity_logs_read_public"
  ON public.activity_logs FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "activity_logs_insert_authenticated" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_authenticated"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "activity_logs_insert_service" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_service"
  ON public.activity_logs FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NULL);

DROP POLICY IF EXISTS "profile_comments_read_public" ON public.profile_comments;
CREATE POLICY "profile_comments_read_public"
  ON public.profile_comments FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "profile_comments_insert_authenticated" ON public.profile_comments;
CREATE POLICY "profile_comments_insert_authenticated"
  ON public.profile_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "profile_comments_delete_admin" ON public.profile_comments;
CREATE POLICY "profile_comments_delete_admin"
  ON public.profile_comments FOR DELETE
  TO authenticated
  USING (public.is_woltar_admin());

DROP POLICY IF EXISTS "anon_read_notif" ON public.notifications;
DROP POLICY IF EXISTS "anon_write_notif" ON public.notifications;

DROP POLICY IF EXISTS "notifications_read_own_or_admin" ON public.notifications;
CREATE POLICY "notifications_read_own_or_admin"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR public.is_woltar_admin());

DROP POLICY IF EXISTS "notifications_insert_admin_or_service" ON public.notifications;
CREATE POLICY "notifications_insert_admin_or_service"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;
CREATE POLICY "notifications_insert_service"
  ON public.notifications FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NULL);

DROP POLICY IF EXISTS "notifications_update_own_or_admin" ON public.notifications;
CREATE POLICY "notifications_update_own_or_admin"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid() OR public.is_woltar_admin())
  WITH CHECK (profile_id = auth.uid() OR public.is_woltar_admin());
