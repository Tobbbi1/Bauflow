-- Datenbank-Bereinigung für Bauflow
-- Entfernung nicht benötigter Tabellen und Korrektur der Verbindungen

-- 1. Nicht benötigte Tabellen entfernen
-- Diese Tabellen werden aktuell nicht verwendet und können entfernt werden

-- Time tracking Tabelle entfernen (wird nicht verwendet)
DROP TABLE IF EXISTS public.time_entries CASCADE;

-- Materials Tabellen entfernen (wird nicht verwendet)
DROP TABLE IF EXISTS public.project_materials CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;

-- Employee invitations Tabelle entfernen (wird über separates System verwaltet)
DROP TABLE IF EXISTS public.employee_invitations CASCADE;

-- 2. Spalten aus tasks Tabelle entfernen, die nicht verwendet werden
-- start_time und end_time werden nicht verwendet, da wir nur Datum-basierte Aufgaben haben
ALTER TABLE public.tasks DROP COLUMN IF EXISTS start_time;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS end_time;

-- 3. Indexe für entfernte Tabellen löschen
DROP INDEX IF EXISTS idx_time_entries_project_id;
DROP INDEX IF EXISTS idx_time_entries_user_id;
DROP INDEX IF EXISTS idx_materials_company_id;
DROP INDEX IF EXISTS idx_employee_invitations_email;
DROP INDEX IF EXISTS idx_employee_invitations_token;

-- 4. Trigger für entfernte Tabellen löschen
DROP TRIGGER IF EXISTS update_time_entries_updated_at ON public.time_entries;
DROP TRIGGER IF EXISTS update_materials_updated_at ON public.materials;

-- 5. RLS Policies für entfernte Tabellen löschen
DROP POLICY IF EXISTS "Users can only manage their own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Managers and admins can view all time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can view materials in their company" ON public.materials;
DROP POLICY IF EXISTS "Managers and admins can manage materials" ON public.materials;
DROP POLICY IF EXISTS "Users can manage materials on their projects" ON public.project_materials;
DROP POLICY IF EXISTS "Admins can manage invitations for their company" ON public.employee_invitations;

-- 6. RLS für entfernte Tabellen deaktivieren
ALTER TABLE public.time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_invitations DISABLE ROW LEVEL SECURITY;

-- 7. Aufgaben-Tabelle optimieren - assigned_to kann NULL sein (wird später zugewiesen)
ALTER TABLE public.tasks ALTER COLUMN assigned_to DROP NOT NULL;

-- 8. Neue Indexe für bessere Performance erstellen
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

-- 9. Funktion zum Setzen der Standardfarbe für Aufgaben verbessern
CREATE OR REPLACE FUNCTION set_task_color_from_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Nur Farbe setzen, wenn keine Farbe bereits gesetzt ist
  IF NEW.color IS NULL OR NEW.color = '' THEN
    SELECT color INTO NEW.color FROM public.projects WHERE id = NEW.project_id;
  END IF;
  
  -- Standardfarbe falls Projekt keine Farbe hat
  IF NEW.color IS NULL OR NEW.color = '' THEN
    NEW.color := '#3B82F6';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger für automatische Farbzuweisung aktualisieren
DROP TRIGGER IF EXISTS set_task_color_trigger ON public.tasks;
CREATE TRIGGER set_task_color_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_color_from_project();

-- 11. Bestehende Daten bereinigen (falls vorhanden)
-- Entferne Aufgaben ohne gültige Projekte
DELETE FROM public.tasks 
WHERE project_id NOT IN (SELECT id FROM public.projects);

-- Entferne Aufgaben mit ungültigen assigned_to Referenzen
DELETE FROM public.tasks 
WHERE assigned_to IS NOT NULL 
AND assigned_to NOT IN (SELECT id FROM public.profiles);

-- 12. Foreign Key Constraints überprüfen und reparieren
-- Diese Constraints sollten bereits korrekt sein, aber zur Sicherheit
ALTER TABLE public.tasks 
ADD CONSTRAINT fk_tasks_project 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.tasks 
ADD CONSTRAINT fk_tasks_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.tasks 
ADD CONSTRAINT fk_tasks_assigned_by 
FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 13. Statistiken aktualisieren
ANALYZE public.companies;
ANALYZE public.profiles;
ANALYZE public.projects;
ANALYZE public.tasks;

-- 14. Bestätigung der Bereinigung
SELECT 
  'Datenbank erfolgreich bereinigt' as status,
  (SELECT COUNT(*) FROM public.companies) as companies_count,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.projects) as projects_count,
  (SELECT COUNT(*) FROM public.tasks) as tasks_count; 