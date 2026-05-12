-- ═══════════════════════════════════════════════════════════════
-- 002_extended_schema.sql — Woltar Nexus v2
-- Paramètres, catégories, rôles, permissions, médias,
-- tables communautaires (bookmarks, comments, notifications…)
-- ═══════════════════════════════════════════════════════════════

-- ─── SITE SETTINGS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT 'null',
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_settings"  ON site_settings FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_settings" ON site_settings FOR ALL    TO anon USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE site_settings;

INSERT INTO site_settings (key, value) VALUES
  ('site_name',           '"Woltar.net"'),
  ('hero_title',          '"Bienvenue sur Woltar"'),
  ('hero_subtitle',       '"Un système planétaire perdu dans l''espace, habité par les Woltariens, Woltariennes et Woltarions."'),
  ('cta_primary',         '{"label":"Entrer dans l''univers","href":"/actualites"}'),
  ('cta_secondary',       '{"label":"Découvrir les événements","href":"/evenements"}'),
  ('maintenance_mode',    'false'),
  ('maintenance_message', '"Site en maintenance. Revenez très bientôt !"'),
  ('discord_url',         '"https://discord.gg/woltar"'),
  ('featured_article_id', 'null'),
  ('featured_event_id',   'null')
ON CONFLICT (key) DO NOTHING;

-- ─── CATEGORIES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  slug           text NOT NULL UNIQUE,
  description    text DEFAULT '',
  icon           text DEFAULT '✦',
  color_primary  text DEFAULT '#1fa8dc',
  color_secondary text DEFAULT '#8b0000',
  image_url      text,
  display_order  int DEFAULT 0,
  is_public      boolean DEFAULT true,
  parent_id      uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_cat"  ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_cat" ON categories FOR ALL    TO anon USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE categories;

INSERT INTO categories (name, slug, description, icon, display_order) VALUES
  ('Actualités',  'actualites', 'Mises à jour, prévention et règles communautaires.', '✦',  1),
  ('Prévention',  'prevention', 'Règles de sécurité et prévention communautaire.',    '🛡',  2),
  ('Règles',      'regles',     'Règlement de la communauté Woltar.',                 '📋',  3),
  ('Événements',  'evenements', 'Animations RP, concours et festivités Woltar.',      '🎪',  4),
  ('Fan-arts',    'fanarts',    'Créations artistiques de la communauté.',            '🎨',  5),
  ('RP',          'rp',         'Récits, intrigues et aventures de l''univers.',      '🎭',  6)
ON CONFLICT (slug) DO NOTHING;

-- ─── ROLES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  label      text NOT NULL,
  color      text DEFAULT '#1fa8dc',
  level      int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_roles"  ON roles FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_roles" ON roles FOR ALL    TO anon USING (true);

INSERT INTO roles (name, label, color, level) VALUES
  ('super_admin',  'Super Admin',          '#ff4444', 100),
  ('admin',        'Admin',                '#8b0000',  90),
  ('charge_com',   'Chargé communication', '#1fa8dc',  70),
  ('animateur_rp', 'Animateur RP',         '#a865d8',  60),
  ('moderateur',   'Modérateur',           '#e8912a',  50),
  ('redacteur',    'Rédacteur',            '#2ecc71',  40),
  ('lecteur',      'Lecteur',              '#95a5a6',  10)
ON CONFLICT (name) DO NOTHING;

-- ─── PERMISSIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  label       text NOT NULL,
  description text DEFAULT '',
  group_name  text DEFAULT 'general'
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_perms"  ON permissions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_perms" ON permissions FOR ALL    TO anon USING (true);

INSERT INTO permissions (key, label, group_name) VALUES
  ('create_article',    'Créer un article',         'Articles'),
  ('edit_article',      'Modifier un article',      'Articles'),
  ('delete_article',    'Supprimer un article',     'Articles'),
  ('publish_article',   'Publier un article',       'Articles'),
  ('schedule_article',  'Programmer un article',    'Articles'),
  ('manage_drafts',     'Gérer les brouillons',     'Articles'),
  ('manage_events',     'Gérer les événements',     'Événements'),
  ('create_form',       'Créer un formulaire',      'Formulaires'),
  ('view_responses',    'Voir les réponses',        'Formulaires'),
  ('export_data',       'Exporter les données',     'Formulaires'),
  ('manage_tickets',    'Gérer les tickets',        'Tickets'),
  ('manage_categories', 'Gérer les catégories',    'Admin'),
  ('manage_users',      'Gérer les utilisateurs',   'Admin'),
  ('manage_settings',   'Gérer les paramètres',    'Admin'),
  ('manage_media',      'Gérer la médiathèque',    'Média')
ON CONFLICT (key) DO NOTHING;

-- ─── ROLE PERMISSIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       uuid REFERENCES roles(id)       ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_rp"  ON role_permissions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_rp" ON role_permissions FOR ALL    TO anon USING (true);

-- ─── USER ROLES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  profile_id  uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_id     uuid REFERENCES roles(id)    ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES profiles(id),
  PRIMARY KEY (profile_id, role_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_ur"  ON user_roles FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_ur" ON user_roles FOR ALL    TO anon USING (true);

-- ─── MEDIA ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  url          text NOT NULL,
  storage_path text,
  mime_type    text DEFAULT 'image/jpeg',
  size_bytes   int  DEFAULT 0,
  tags         text[] DEFAULT '{}',
  uploaded_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_media"  ON media FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_media" ON media FOR ALL    TO anon USING (true);

-- ─── BADGES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  icon        text DEFAULT '⭐',
  color       text DEFAULT '#1fa8dc',
  description text DEFAULT ''
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_badges"  ON badges FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_badges" ON badges FOR ALL    TO anon USING (true);

-- ─── USER BADGES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id   uuid REFERENCES badges(id)   ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  PRIMARY KEY (profile_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_ub"  ON user_badges FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_ub" ON user_badges FOR ALL    TO anon USING (true);

-- ─── BOOKMARKS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (profile_id, article_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_bm"  ON bookmarks FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_bm" ON bookmarks FOR ALL    TO anon USING (true);

-- ─── COMMENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  uuid REFERENCES articles(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content     text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_comments"  ON comments FOR SELECT TO anon USING (is_approved = true);
CREATE POLICY "anon_write_comments" ON comments FOR ALL    TO anon USING (true);

-- ─── NOTIFICATIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type       text NOT NULL DEFAULT 'info',
  title      text DEFAULT '',
  body       text DEFAULT '',
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_notif"  ON notifications FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_notif" ON notifications FOR ALL    TO anon USING (true);

-- ─── EVENT PARTICIPANTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_participants (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid REFERENCES articles(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status     text DEFAULT 'registered',
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, profile_id)
);

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_ep"  ON event_participants FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_ep" ON event_participants FOR ALL    TO anon USING (true);

-- ─── TICKET MESSAGES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid REFERENCES tickets(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content     text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_tm"  ON ticket_messages FOR SELECT TO anon USING (true);
CREATE POLICY "anon_write_tm" ON ticket_messages FOR ALL    TO anon USING (true);

-- ─── ALTER EXISTING TABLES ───────────────────────────────────────
ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio             text    DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_link    text    DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_visible boolean DEFAULT true;
