-- Script de nettoyage pour supprimer définitivement les données de démonstration Akwaba LMS
-- À exécuter dans l'éditeur SQL de Supabase (Tableau de bord -> SQL Editor -> New Query)

-- 1. Supprimer les messages liés aux utilisateurs démo
DELETE FROM messages 
WHERE from_id IN ('u1', 'u2', 'u3', 'u4') 
   OR to_id IN ('u1', 'u2', 'u3', 'u4');

-- 2. Supprimer les inscriptions liées aux utilisateurs démo ou cours démo
DELETE FROM enrollments 
WHERE user_id IN ('u1', 'u2', 'u3', 'u4')
   OR course_id IN ('c1', 'c2', 'c3', 'c4', 'c5');

-- 3. Supprimer les modules liés aux cours démo
DELETE FROM modules 
WHERE course_id IN ('c1', 'c2', 'c3', 'c4', 'c5');

-- 4. Supprimer les cours démo
DELETE FROM courses 
WHERE id IN ('c1', 'c2', 'c3', 'c4', 'c5')
   OR instructor_id IN ('u1', 'u2', 'u3', 'u4');

-- 5. Supprimer les utilisateurs démo
DELETE FROM users 
WHERE id IN ('u1', 'u2', 'u3', 'u4');

-- 6. (Optionnel) Supprimer les codes d'accès générés par les admins démo
DELETE FROM access_codes
WHERE generated_by IN ('u1', 'u2', 'u3', 'u4');

-- Confirmation
SELECT 'Nettoyage terminé avec succès' as status;
