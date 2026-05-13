-- ═══════════════════════════════════════════════════════════════
-- Migration 004 — Sécurité : suppression mots de passe en clair
-- + champs woltariens sur members
-- + tables sondages, popups annonces
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Supprimer les colonnes password en clair
--    L'authentification est désormais gérée exclusivement par Supabase Auth
ALTER TABLE members  DROP COLUMN IF EXISTS password;
ALTER TABLE profiles DROP COLUMN IF EXISTS password;

-- 2. Ajouter champs woltariens sur members (données communauté)
ALTER TABLE members ADD COLUMN IF NOT EXISTS woltarien1 TEXT DEFAULT '';
ALTER TABLE members ADD COLUMN IF NOT EXISTS woltarien2 TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS bio        TEXT DEFAULT '';

-- 3. Lier members à auth.users (clé étrangère facultative)
--    Permet de retrouver un membre par son auth.users.id
ALTER TABLE members ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── Sondages ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS polls (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  description  TEXT        DEFAULT '',
  options      JSONB       NOT NULL DEFAULT '[]',
  status       TEXT        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft','pending_review','published','closed','archived')),
  is_pinned    BOOLEAN     NOT NULL DEFAULT FALSE,
  allow_multi  BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at   TIMESTAMPTZ,
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    UUID        NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  voter_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  voter_pseudo TEXT,
  option_idx INT         NOT NULL,
  voted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, voter_id)
);

ALTER TABLE polls       ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_polls"       ON polls       FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "auth_read_polls"       ON polls       FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_polls"      ON polls       FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_poll_votes"  ON poll_votes  FOR SELECT TO anon  USING (true);
CREATE POLICY "auth_write_poll_votes" ON poll_votes  FOR ALL    TO authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;

-- ── Popups / Annonces ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL DEFAULT '',
  body         TEXT        NOT NULL DEFAULT '',
  style        TEXT        NOT NULL DEFAULT 'glass_cyan'
                           CHECK (style IN ('glass_cyan','rouge_woltar','minimal_manga')),
  type         TEXT        NOT NULL DEFAULT 'news'
                           CHECK (type IN ('news','event','maintenance')),
  is_active    BOOLEAN     NOT NULL DEFAULT FALSE,
  scheduled_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  cta_label    TEXT,
  cta_url      TEXT,
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_ann"  ON announcements FOR SELECT TO anon  USING (is_active = true);
CREATE POLICY "auth_all_ann"   ON announcements FOR ALL    TO authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

-- ── Permissions supplémentaires ───────────────────────────────
INSERT INTO permissions (key, label, group_name) VALUES
  ('manage_polls',     'Gérer les sondages',     'Sondages'),
  ('vote_poll',        'Voter aux sondages',      'Sondages'),
  ('validate_poll',    'Valider les sondages',    'Sondages'),
  ('create_popup',     'Créer des annonces',      'Annonces'),
  ('manage_popups',    'Gérer les annonces',      'Annonces'),
  ('view_stats',       'Voir les statistiques',   'Stats'),
  ('manage_members',   'Gérer les membres',       'Admin')
ON CONFLICT (key) DO NOTHING;

-- ── Badge par défaut ──────────────────────────────────────────
INSERT INTO badges (name, icon, color, description) VALUES
  ('Association',        '◈', '#ffd700', 'Membre de l''association Woltar'),
  ('Modération Discord', '◉', '#a865d8', 'Modérateur Discord Woltar'),
  ('Intérimaire',        '◇', '#e8912a', 'Membre intérimaire'),
  ('Certifié',           '◆', '#1fa8dc', 'Compte certifié Woltar')
ON CONFLICT DO NOTHING;
