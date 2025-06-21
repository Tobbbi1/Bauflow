-- Bauplaner Datenbankschema für Supabase

-- Projekte Tabelle
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aufgaben Tabelle
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materialien Tabelle
CREATE TABLE materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2),
  unit TEXT,
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zeitplan Tabelle
CREATE TABLE schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) aktivieren
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies (für öffentlichen Zugriff - später können Sie diese anpassen)
CREATE POLICY "Öffentlicher Zugriff auf Projekte" ON projects FOR ALL USING (true);
CREATE POLICY "Öffentlicher Zugriff auf Aufgaben" ON tasks FOR ALL USING (true);
CREATE POLICY "Öffentlicher Zugriff auf Materialien" ON materials FOR ALL USING (true);
CREATE POLICY "Öffentlicher Zugriff auf Zeitplan" ON schedule FOR ALL USING (true);

-- Indizes für bessere Performance
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_materials_project_id ON materials(project_id);
CREATE INDEX idx_schedule_project_id ON schedule(project_id);
CREATE INDEX idx_schedule_task_id ON schedule(task_id); 