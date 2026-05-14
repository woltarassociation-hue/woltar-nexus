-- ============================================================
-- Woltar Nexus · Migration 011
-- Badges sociaux premium — category, rarity, badge_context
--
-- Ré-exécutable dans le SQL Editor Supabase.
-- Ne supprime aucune donnée existante.
-- ============================================================


-- 1. Colonnes supplémentaires sur badges
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS rarity   text NOT NULL DEFAULT 'common';

-- 2. Contextualisation optionnelle sur user_badges
--    Permet "Gagnant — Concours Noël 2026" etc.
ALTER TABLE public.user_badges ADD COLUMN IF NOT EXISTS badge_context text;


-- 3. Mise à jour des badges existants (par key)
UPDATE public.badges SET name = 'Créateur Woltar', category = 'officiel',   rarity = 'legendary' WHERE key = 'fondateur';
UPDATE public.badges SET name = 'Staff Woltar',    category = 'officiel',   rarity = 'epic'      WHERE key = 'staff';
UPDATE public.badges SET name = 'Membre certifié', category = 'officiel',   rarity = 'rare'      WHERE key = 'certifie';
UPDATE public.badges SET name = 'Artiste officiel',category = 'creation',   rarity = 'epic'      WHERE key = 'artiste_officiel';
UPDATE public.badges SET                           category = 'officiel',   rarity = 'legendary' WHERE key = 'association';
UPDATE public.badges SET                           category = 'officiel',   rarity = 'epic'      WHERE key = 'modo_discord';
UPDATE public.badges SET                           category = 'officiel',   rarity = 'rare'      WHERE key = 'moderateur_hon';
UPDATE public.badges SET                           category = 'officiel',   rarity = 'rare'      WHERE key = 'partenaire';
UPDATE public.badges SET                           category = 'communaute', rarity = 'rare'      WHERE key = 'veteran';
UPDATE public.badges SET                           category = 'communaute', rarity = 'legendary' WHERE key = 'woltarien_or';


-- 4. Insertion conditionnelle des nouveaux badges sociaux (par key)
INSERT INTO public.badges (name, icon, color, description, key, category, rarity)
SELECT v.name, v.icon, v.color, v.description, v.key, v.category, v.rarity
FROM (VALUES
  ('Auteur RP',        '📖', '#1abc9c', 'Auteur reconnu dans le roleplay Woltar',      'auteur_rp',        'creation',   'rare'),
  ('Dev contributor',  '💻', '#a865d8', 'Contributeur au développement de Woltar',     'dev_contributor',  'creation',   'epic'),
  ('Pro Woltar',       '🏅', '#f39c12', 'Membre actif et impliqué dans la communauté', 'pro_woltar',       'communaute', 'rare'),
  ('Top contributeur', '🏆', '#e67e22', 'Contribution exceptionnelle à la communauté', 'top_contributeur', 'communaute', 'rare'),
  ('Gagnant',          '🥇', '#ffd700', 'Vainqueur d''un événement Woltar',            'gagnant',          'evenements', 'uncommon'),
  ('Participant',      '🎪', '#3498db', 'Participant à un événement Woltar',            'participant',      'evenements', 'common'),
  ('Organisateur',     '🎯', '#2ecc71', 'Organisateur d''un événement Woltar',         'organisateur',     'evenements', 'rare')
) AS v(name, icon, color, description, key, category, rarity)
WHERE NOT EXISTS (
  SELECT 1 FROM public.badges WHERE badges.key = v.key
);


-- Vérification post-migration
SELECT id, name, icon, color, key, category, rarity FROM public.badges ORDER BY category, name;
