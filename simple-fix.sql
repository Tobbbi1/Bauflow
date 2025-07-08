-- Einfaches Fix-Skript für Bauflow
-- Nur die notwendigen Änderungen für die neue Funktionalität

-- 1. Spalten aus tasks Tabelle entfernen, die nicht verwendet werden
ALTER TABLE public.tasks DROP COLUMN IF EXISTS start_time;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS end_time;

-- 2. Aufgaben-Tabelle optimieren - assigned_to kann NULL sein
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

-- 3. Neue Indexe für bessere Performance erstellen
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

-- 4. Funktion zum Setzen der Standardfarbe für Aufgaben verbessern
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

-- 5. Trigger für automatische Farbzuweisung aktualisieren
DROP TRIGGER IF EXISTS set_task_color_trigger ON public.tasks;
CREATE TRIGGER set_task_color_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_color_from_project();

-- 6. Bestätigung der Änderungen
SELECT 
  'Datenbank erfolgreich aktualisiert' as status,
  (SELECT COUNT(*) FROM public.companies) as companies_count,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.projects) as projects_count,
  (SELECT COUNT(*) FROM public.tasks) as tasks_count; 