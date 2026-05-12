-- ============================================================
-- Woltar.net — Schéma initial Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- ── Articles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id            TEXT        PRIMARY KEY,
  title         TEXT        NOT NULL DEFAULT '',
  slug          TEXT        NOT NULL DEFAULT '',
  category      TEXT        NOT NULL DEFAULT 'actualites',
  subcategory   TEXT,
  status        TEXT        NOT NULL DEFAULT 'draft',
  content       TEXT,
  summary       TEXT,
  author        TEXT,
  cover_url     TEXT,
  cover_mode    TEXT,
  font          TEXT,
  title_font    TEXT,
  body_font     TEXT,
  title_color   TEXT,
  text_color    TEXT,
  accent_color  TEXT,
  featured      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Formulaires ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forms (
  id            TEXT        PRIMARY KEY,
  title         TEXT        NOT NULL DEFAULT '',
  description   TEXT,
  category      TEXT                 DEFAULT 'evenements',
  subcategory   TEXT,
  status        TEXT        NOT NULL DEFAULT 'draft',
  open_date     TEXT,
  close_date    TEXT,
  fields        JSONB       NOT NULL DEFAULT '[]',
  rp_options    JSONB       NOT NULL DEFAULT '{}',
  other_options JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Réponses de formulaires ──────────────────────────────────
CREATE TABLE IF NOT EXISTS form_responses (
  id               TEXT        PRIMARY KEY,
  form_id          TEXT        NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  pseudo           TEXT,
  fields           JSONB       NOT NULL DEFAULT '{}',
  stats_values     JSONB       NOT NULL DEFAULT '{}',
  custom_rp_fields JSONB       NOT NULL DEFAULT '{}',
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tickets support ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id          TEXT        PRIMARY KEY,
  pseudo      TEXT,
  email       TEXT,
  category    TEXT,
  subject     TEXT,
  message     TEXT,
  urgency     TEXT,
  image_url   TEXT,
  status      TEXT        NOT NULL DEFAULT 'Ouvert',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Profils association ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          TEXT        PRIMARY KEY,
  name        TEXT,
  role        TEXT,
  username    TEXT        UNIQUE,
  password    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Membres communauté ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id          TEXT        PRIMARY KEY,
  pseudo      TEXT        UNIQUE,
  password    TEXT,
  role        TEXT        NOT NULL DEFAULT 'membre',
  avatar      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Candidatures RP ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidatures (
  id              TEXT        PRIMARY KEY,
  pseudo          TEXT,
  nom_woltarien   TEXT,
  stats           JSONB       NOT NULL DEFAULT '{}',
  status          TEXT        NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Affiche événement (singleton) ───────────────────────────
CREATE TABLE IF NOT EXISTS event_highlights (
  id          TEXT        PRIMARY KEY,
  title       TEXT,
  summary     TEXT,
  image_url   TEXT,
  link        TEXT,
  date_start  TEXT,
  date_end    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- Index utiles
-- ============================================================
CREATE INDEX IF NOT EXISTS articles_category_status ON articles (category, status);
CREATE INDEX IF NOT EXISTS articles_slug            ON articles (category, slug);
CREATE INDEX IF NOT EXISTS forms_status             ON forms (status);
CREATE INDEX IF NOT EXISTS form_responses_form_id   ON form_responses (form_id);
CREATE INDEX IF NOT EXISTS tickets_status           ON tickets (status);
CREATE INDEX IF NOT EXISTS candidatures_status      ON candidatures (status);


-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
-- Toutes les tables utilisent la clé anon — le site n'a pas
-- d'authentification Supabase Auth. RLS activé avec politique
-- permissive pour la clé anon.

ALTER TABLE articles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms           ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatures    ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_highlights ENABLE ROW LEVEL SECURITY;

-- Accès complet pour la clé anon (le contrôle d'accès est
-- géré côté application via les sessions localStorage)
CREATE POLICY "anon_all_articles"        ON articles        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_forms"           ON forms           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_form_responses"  ON form_responses  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_tickets"         ON tickets         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_profiles"        ON profiles        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_members"         ON members         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_candidatures"    ON candidatures    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_event_highlights" ON event_highlights FOR ALL TO anon USING (true) WITH CHECK (true);


-- ============================================================
-- Realtime
-- ============================================================
-- Active la réplication Realtime sur toutes les tables pour
-- que les mises à jour se propagent instantanément à tous
-- les clients connectés.

ALTER PUBLICATION supabase_realtime ADD TABLE articles;
ALTER PUBLICATION supabase_realtime ADD TABLE forms;
ALTER PUBLICATION supabase_realtime ADD TABLE form_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE members;
ALTER PUBLICATION supabase_realtime ADD TABLE candidatures;
ALTER PUBLICATION supabase_realtime ADD TABLE event_highlights;
