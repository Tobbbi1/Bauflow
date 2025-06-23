-- Bauflow Migration Script - Sicherer Update für bestehende Datenbank
-- Führen Sie dieses Script aus, um Ihre bestehende Datenbank zu aktualisieren

-- Enable necessary extensions (falls nicht vorhanden)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles enum (falls nicht vorhanden)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update companies table (falls neue Spalten fehlen)
DO $$ BEGIN
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update projects table (falls neue Spalten fehlen)
DO $$ BEGIN
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contact_person_name VARCHAR(255);
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contact_person_phone VARCHAR(50);
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update tasks table (falls neue Spalten fehlen)
DO $$ BEGIN
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_date DATE;
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS end_date DATE;
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_time TIME;
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS end_time TIME;
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2);
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2);
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS color VARCHAR(7);
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create employee_invitations table (falls nicht vorhanden)
CREATE TABLE IF NOT EXISTS public.employee_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES public.profiles(id),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'employee',
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_materials table (falls nicht vorhanden)
CREATE TABLE IF NOT EXISTS public.project_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    UNIQUE(project_id, material_id)
);

-- Update profiles table (falls neue Spalten fehlen)
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'employee';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create indexes (falls nicht vorhanden)
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON public.profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON public.projects(end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON public.tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON public.tasks(end_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON public.time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_company_id ON public.materials(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_invitations_email ON public.employee_invitations(email);
CREATE INDEX IF NOT EXISTS idx_employee_invitations_token ON public.employee_invitations(invitation_token);

-- Create updated_at trigger function (falls nicht vorhanden)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers (falls nicht vorhanden)
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_entries_updated_at ON public.time_entries;
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_materials_updated_at ON public.materials;
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper Functions (falls nicht vorhanden)
CREATE OR REPLACE FUNCTION get_user_company_id(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN (SELECT company_id FROM public.profiles WHERE id = user_id);
END;
$$;

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = user_id);
END;
$$;

-- Function to automatically set task color based on project color
CREATE OR REPLACE FUNCTION set_task_color_from_project()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.color IS NULL THEN
    SELECT color INTO NEW.color FROM public.projects WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set task color (falls nicht vorhanden)
DROP TRIGGER IF EXISTS set_task_color_trigger ON public.tasks;
CREATE TRIGGER set_task_color_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_color_from_project();

-- Update existing profiles to have a role (falls nicht vorhanden)
UPDATE public.profiles SET role = 'admin' WHERE role IS NULL;

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- Drop old policies and create new ones
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Admins can manage their company" ON public.companies;
DROP POLICY IF EXISTS "Allow authenticated users to create companies" ON public.companies;
DROP POLICY IF EXISTS "Allow users to view their own company" ON public.companies;
DROP POLICY IF EXISTS "Allow company admins to update and delete" ON public.companies;
DROP POLICY IF EXISTS "Allow company creation during signup" ON public.companies;
DROP POLICY IF EXISTS "Allow company admins to update" ON public.companies;
DROP POLICY IF EXISTS "Allow company admins to delete" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view company members" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage company users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view company projects" ON public.projects;
DROP POLICY IF EXISTS "Managers and admins can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view company tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers and admins can manage tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can only manage their own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Managers and admins can view all time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can view company materials" ON public.materials;
DROP POLICY IF EXISTS "Managers and admins can manage materials" ON public.materials;
DROP POLICY IF EXISTS "Users can manage materials on their projects" ON public.project_materials;
DROP POLICY IF EXISTS "Admins can manage invitations for their company" ON public.employee_invitations;

-- Create new RLS policies
CREATE POLICY "Allow company creation during signup" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can update their company" ON public.companies FOR UPDATE USING (id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can delete their company" ON public.companies FOR DELETE USING (id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view their own profile and company members" ON public.profiles FOR SELECT USING (id = auth.uid() OR company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage users in their company" ON public.profiles FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view projects in their company" ON public.projects FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Managers and admins can manage projects" ON public.projects FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Users can view tasks in their company" ON public.tasks FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Users can update their assigned tasks" ON public.tasks FOR UPDATE USING (assigned_to = auth.uid());
CREATE POLICY "Managers and admins can manage tasks" ON public.tasks FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid())) AND get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Users can manage their own time entries" ON public.time_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins/Managers can view all company time entries" ON public.time_entries FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'manager') AND user_id IN (SELECT id FROM public.profiles WHERE company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Users can view materials in their company" ON public.materials FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Managers and admins can manage materials" ON public.materials FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Users can manage materials on projects in their company" ON public.project_materials FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Admins can manage invitations for their company" ON public.employee_invitations FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- Success message
SELECT 'Migration erfolgreich abgeschlossen! Alle Tabellen und Policies wurden aktualisiert.' as status; 