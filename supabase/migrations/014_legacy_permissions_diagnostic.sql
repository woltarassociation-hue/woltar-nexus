-- ============================================================
-- Woltar Nexus · Migration 014
-- Diagnostic des tables legacy rôles / permissions
--
-- Ne supprime rien.
-- À exécuter avant toute suppression des tables legacy.
-- ============================================================

SELECT 'roles' AS table_name, count(*) AS row_count
FROM public.roles
UNION ALL
SELECT 'permissions' AS table_name, count(*) AS row_count
FROM public.permissions
UNION ALL
SELECT 'role_permissions' AS table_name, count(*) AS row_count
FROM public.role_permissions
UNION ALL
SELECT 'user_roles' AS table_name, count(*) AS row_count
FROM public.user_roles;


SELECT
  tc.table_name,
  tc.constraint_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('roles', 'permissions', 'role_permissions', 'user_roles')
ORDER BY tc.table_name, tc.constraint_name;
