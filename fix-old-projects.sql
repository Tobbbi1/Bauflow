-- Fix für alte Baustellen ohne company_id
-- Führen Sie dieses Script aus, um alten Baustellen die company_id hinzuzufügen

-- Zeige alle Baustellen ohne company_id
SELECT 'Baustellen ohne company_id:' as info;
SELECT id, name, created_at FROM projects WHERE company_id IS NULL;

-- Update: Setze company_id für alle Baustellen ohne company_id
-- Wir nehmen die company_id vom ersten Benutzer, der die Baustelle erstellt hat
UPDATE projects 
SET company_id = (
    SELECT company_id 
    FROM profiles 
    WHERE id = projects.created_by 
    LIMIT 1
)
WHERE company_id IS NULL;

-- Falls created_by auch NULL ist, nehmen wir die company_id vom ersten Benutzer
UPDATE projects 
SET company_id = (
    SELECT company_id 
    FROM profiles 
    WHERE company_id IS NOT NULL 
    LIMIT 1
)
WHERE company_id IS NULL;

-- Zeige das Ergebnis
SELECT 'Nach dem Update:' as info;
SELECT id, name, company_id, created_at FROM projects;

-- Success message
SELECT 'Alte Baustellen erfolgreich mit company_id aktualisiert!' as status; 