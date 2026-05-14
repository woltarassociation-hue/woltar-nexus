-- ============================================================
-- Woltar Nexus · Migration 017
-- Hotfix publication article : colonne bg_color manquante
--
-- Idempotent : n'écrase rien et ne change pas le comportement
-- existant hors ajout de colonne.
-- ============================================================

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS bg_color text;

-- Vérification post-migration
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'articles'
  AND column_name IN (
    'font', 'title_font', 'body_font',
    'title_color', 'text_color', 'accent_color', 'bg_color'
  )
ORDER BY column_name;
