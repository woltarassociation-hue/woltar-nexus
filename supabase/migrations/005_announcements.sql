-- ═══════════════════════════════════════════════════════════════
-- 005_announcements.sql — Woltar Nexus
-- Table publique des annonces/popups affichées sur le site
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.announcements (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  body         text        NOT NULL DEFAULT '',
  type         text        NOT NULL DEFAULT 'news'
                           CHECK (type IN ('news', 'event', 'maintenance')),
  style        text        NOT NULL DEFAULT 'glass_cyan'
                           CHECK (style IN ('glass_cyan', 'rouge_woltar', 'minimal_manga')),
  cta_label    text,
  cta_url      text,
  image_url    text,
  is_active    boolean     NOT NULL DEFAULT false,
  scheduled_at timestamptz,
  expires_at   timestamptz,
  created_by   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── Index pour les requêtes fréquentes ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_announcements_active
  ON public.announcements (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_schedule
  ON public.announcements (scheduled_at, expires_at)
  WHERE is_active = true;

-- ─── Trigger updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Lecture publique : visiteurs et admin peuvent tout lire
CREATE POLICY "anon_read_announcements"
  ON public.announcements FOR SELECT
  TO anon
  USING (true);

-- Écriture : admin (anon key avec privilèges)
-- Même pattern que les autres tables du projet (site_settings, categories…)
CREATE POLICY "anon_write_announcements"
  ON public.announcements FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ─── Realtime (optionnel — pour futures mises à jour live) ───────
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
