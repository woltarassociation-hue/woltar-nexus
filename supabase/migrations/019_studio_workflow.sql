-- ============================================================
-- Woltar Nexus · Migration 019
-- Studio communautaire : workflow publications (fanarts/actualités)
-- Idempotente / ré-exécutable.
-- ============================================================

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS author_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS refused_at timestamptz;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS refused_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS validation_note text;

CREATE INDEX IF NOT EXISTS idx_articles_author_profile ON public.articles(author_profile_id);
CREATE INDEX IF NOT EXISTS idx_articles_status_category ON public.articles(status, category);

CREATE TABLE IF NOT EXISTS public.article_workflow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id text NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_workflow_logs_article_created
  ON public.article_workflow_logs(article_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_studio_validator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('communication', 'administrateur', 'dev')
  );
$$;

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_workflow_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_read_published" ON public.articles;
DROP POLICY IF EXISTS "articles_admin_all" ON public.articles;

DROP POLICY IF EXISTS "articles_read_public_or_workflow" ON public.articles;
CREATE POLICY "articles_read_public_or_workflow"
  ON public.articles FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    OR (
      auth.uid() IS NOT NULL
      AND (
        author_profile_id = auth.uid()
        OR public.is_studio_validator()
      )
    )
  );

DROP POLICY IF EXISTS "articles_insert_author" ON public.articles;
CREATE POLICY "articles_insert_author"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      author_profile_id = auth.uid()
      OR public.is_studio_validator()
    )
  );

DROP POLICY IF EXISTS "articles_update_author_or_validator" ON public.articles;
CREATE POLICY "articles_update_author_or_validator"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      author_profile_id = auth.uid()
      OR public.is_studio_validator()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      author_profile_id = auth.uid()
      OR public.is_studio_validator()
    )
  );

DROP POLICY IF EXISTS "articles_delete_validator" ON public.articles;
CREATE POLICY "articles_delete_validator"
  ON public.articles FOR DELETE
  TO authenticated
  USING (public.is_studio_validator());

DROP POLICY IF EXISTS "article_workflow_logs_read" ON public.article_workflow_logs;
CREATE POLICY "article_workflow_logs_read"
  ON public.article_workflow_logs FOR SELECT
  TO authenticated
  USING (
    public.is_studio_validator()
    OR actor_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.articles a
      WHERE a.id = article_workflow_logs.article_id
        AND a.author_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "article_workflow_logs_insert" ON public.article_workflow_logs;
CREATE POLICY "article_workflow_logs_insert"
  ON public.article_workflow_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      actor_profile_id = auth.uid()
      OR public.is_studio_validator()
    )
  );
