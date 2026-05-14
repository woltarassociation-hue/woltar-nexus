-- ============================================================
-- Woltar Nexus · Migration 010
-- Badges standard — colonne key + seed initial
--
-- Ré-exécutable dans le SQL Editor Supabase.
-- Ne supprime aucune donnée existante.
-- ============================================================


-- 1. Colonne key — identifiant programmatique stable
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS key text;

-- Index unique sparse : seules les valeurs non-null doivent être uniques.
CREATE UNIQUE INDEX IF NOT EXISTS badges_key_idx ON public.badges (key)
  WHERE key IS NOT NULL;


-- 2. Seed des badges standard (insertion conditionnelle par nom)
--    ON CONFLICT n'est pas utilisable sans contrainte UNIQUE sur name.
--    On insère uniquement si le badge n'existe pas déjà.
INSERT INTO public.badges (name, icon, color, description, key)
SELECT v.name, v.icon, v.color, v.description, v.key
FROM (VALUES
  ('Staff',             '🛡',  '#e74c3c', 'Membre de l''équipe Woltar',             'staff'),
  ('Fondateur',         '⭐',  '#f39c12', 'Fondateur de l''association Woltar',      'fondateur'),
  ('Artiste Officiel',  '🎨',  '#9b59b6', 'Artiste reconnu par la communauté',      'artiste_officiel'),
  ('Certifié',          '✅',  '#3498db', 'Compte certifié Woltar',                 'certifie'),
  ('Partenaire',        '🤝',  '#2ecc71', 'Organisation partenaire de Woltar',      'partenaire'),
  ('Vétéran',           '🏆',  '#e67e22', 'Membre présent depuis les débuts',       'veteran'),
  ('Modérateur Honor.', '⚖',   '#1abc9c', 'Modérateur communautaire honoraire',     'moderateur_hon'),
  ('Woltarien d''Or',   '✨',  '#ffd700', 'Distinction suprême de la communauté',   'woltarien_or')
) AS v(name, icon, color, description, key)
WHERE NOT EXISTS (
  SELECT 1 FROM public.badges WHERE badges.name = v.name
);


-- 3. Mettre à jour la colonne key des badges existants (seeding 004)
UPDATE public.badges SET key = 'association'   WHERE name = 'Association'        AND key IS NULL;
UPDATE public.badges SET key = 'modo_discord'  WHERE name = 'Modération Discord' AND key IS NULL;


-- 4. S'assurer que les policies RLS user_badges sont correctes
--    (au cas où elles auraient été écrasées par une migration antérieure)
DROP POLICY IF EXISTS "user_badges_read_authenticated" ON public.user_badges;
DROP POLICY IF EXISTS "user_badges_admin_all"          ON public.user_badges;

CREATE POLICY "user_badges_read_authenticated"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "user_badges_admin_all"
  ON public.user_badges FOR ALL
  TO authenticated
  USING  (public.is_woltar_admin())
  WITH CHECK (public.is_woltar_admin());


-- Vérification post-migration
SELECT id, name, icon, color, key FROM public.badges ORDER BY name;
