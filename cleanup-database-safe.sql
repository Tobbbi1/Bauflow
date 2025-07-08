-- Sicheres Datenbank-Bereinigungsskript für Bauflow
-- Entfernung nur der nicht benötigten Tabellen und Spalten
-- FÜR BEREITS EXISTIERENDE DATENBANKEN

-- 1. Nicht benötigte Tabellen entfernen (nur wenn sie existieren)
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

-- 3. Indexe für entfernte Tabellen löschen (nur wenn sie existieren)
DROP INDEX IF EXISTS idx_time_entries_project_id;
DROP INDEX IF EXISTS idx_time_entries_user_id;
DROP INDEX IF EXISTS idx_materials_company_id;
DROP INDEX IF EXISTS idx_employee_invitations_email;
DROP INDEX IF EXISTS idx_employee_invitations_token;

-- 4. Trigger für entfernte Tabellen löschen (nur wenn sie existieren)
DROP TRIGGER IF EXISTS update_time_entries_updated_at ON public.time_entries;
DROP TRIGGER IF EXISTS update_materials_updated_at ON public.materials;

-- 5. RLS Policies für entfernte Tabellen löschen (nur wenn sie existieren)
DROP POLICY IF EXISTS "Users can only manage their own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Managers and admins can view all time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can view materials in their company" ON public.materials;
DROP POLICY IF EXISTS "Managers and admins can manage materials" ON public.materials;
DROP POLICY IF EXISTS "Users can manage materials on their projects" ON public.project_materials;
DROP POLICY IF EXISTS "Admins can manage invitations for their company" ON public.employee_invitations;

-- 6. RLS für entfernte Tabellen deaktivieren (nur wenn sie existieren)
-- Diese Befehle werden ignoriert, wenn die Tabellen nicht existieren
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'time_entries') THEN
        ALTER TABLE public.time_entries DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materials') THEN
        ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_materials') THEN
        ALTER TABLE public.project_materials DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_invitations') THEN
        ALTER TABLE public.employee_invitations DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 7. Aufgaben-Tabelle optimieren - assigned_to kann NULL sein (wird später zugewiesen)
-- Prüfen ob die Spalte bereits NULL erlaubt
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'assigned_to' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.tasks ALTER COLUMN assigned_to DROP NOT NULL;
    END IF;
END $$;

-- 8. Neue Indexe für bessere Performance erstellen (nur wenn sie nicht existieren)
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

-- 12. Foreign Key Constraints überprüfen und reparieren (nur wenn sie nicht existieren)
DO $$
BEGIN
    -- Prüfen ob fk_tasks_project bereits existiert
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tasks_project' 
        AND table_schema = 'public' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT fk_tasks_project 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
    
    -- Prüfen ob fk_tasks_assigned_to bereits existiert
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tasks_assigned_to' 
        AND table_schema = 'public' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT fk_tasks_assigned_to 
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    
    -- Prüfen ob fk_tasks_assigned_by bereits existiert
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tasks_assigned_by' 
        AND table_schema = 'public' 
        AND table_name = 'tasks'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT fk_tasks_assigned_by 
        FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

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