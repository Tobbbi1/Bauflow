-- Bauflow Database Schema - Erweiterte Version
-- Mit Farben für Baustellen und Aufgaben, erweiterte Aufgabenverwaltung

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Companies table
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');

-- USER MANAGEMENT (Supabase Auth Integration)
-- Drop dependent objects first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the old users table
DROP TABLE IF EXISTS public.users CASCADE;

-- Create a `profiles` table to store public user data.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user, linked to the Supabase auth system.';
COMMENT ON COLUMN public.profiles.id IS 'Links to auth.users.id. Primary key.';

-- Supabase Trigger Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_id_from_meta UUID;
  user_role_from_meta user_role;
BEGIN
  company_id_from_meta := (new.raw_user_meta_data->>'companyId')::UUID;
  user_role_from_meta := (new.raw_user_meta_data->>'role')::user_role;

  INSERT INTO public.profiles (id, first_name, last_name, role, company_id)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'firstName',
    new.raw_user_meta_data->>'lastName',
    COALESCE(user_role_from_meta, 'employee'),
    company_id_from_meta
  );
  RETURN new;
END;
$$;

-- Supabase Trigger: on_auth_user_created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Projects table (Baustellen) - ERWEITERT mit Farben
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    description TEXT,
    contact_person_name VARCHAR(255),
    contact_person_phone VARCHAR(50),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'planning',
    budget DECIMAL(12,2),
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code for project color
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table - ERWEITERT für Aufgabenverwaltung
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id),
    assigned_by UUID REFERENCES public.profiles(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    start_date DATE, -- Startdatum der Aufgabe
    end_date DATE, -- Enddatum der Aufgabe
    start_time TIME, -- Startzeit (optional)
    end_time TIME, -- Endzeit (optional)
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    color VARCHAR(7), -- Farbe der Aufgabe (wird von der Baustelle übernommen)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time tracking table
CREATE TABLE public.time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials table
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50),
    price_per_unit DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    supplier VARCHAR(255),
    supplier_contact VARCHAR(255),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project materials (many-to-many relationship)
CREATE TABLE public.project_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    UNIQUE(project_id, material_id)
);

-- Employee invitations table
CREATE TABLE public.employee_invitations (
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

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_company_id;
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_projects_company_id ON public.projects(company_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_start_date ON public.tasks(start_date);
CREATE INDEX idx_tasks_end_date ON public.tasks(end_date);
CREATE INDEX idx_time_entries_project_id ON public.time_entries(project_id);
CREATE INDEX idx_materials_company_id ON public.materials(company_id);
CREATE INDEX idx_employee_invitations_email ON public.employee_invitations(email);
CREATE INDEX idx_employee_invitations_token ON public.employee_invitations(invitation_token);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper Functions to prevent RLS recursion
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

-- Trigger to automatically set task color
CREATE TRIGGER set_task_color_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_color_from_project();

-- Row Level Security (RLS) policies
-- Drop all old policies to ensure a clean slate
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

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- Company RLS Policies
CREATE POLICY "Allow company creation during signup" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can update their company" ON public.companies FOR UPDATE USING (id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can delete their company" ON public.companies FOR DELETE USING (id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile and company members" ON public.profiles FOR SELECT USING (id = auth.uid() OR company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage users in their company" ON public.profiles FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- Project RLS Policies
CREATE POLICY "Users can view projects in their company" ON public.projects FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Managers and admins can manage projects" ON public.projects FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Task RLS Policies
CREATE POLICY "Users can view tasks in their company" ON public.tasks FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Users can update their assigned tasks" ON public.tasks FOR UPDATE USING (assigned_to = auth.uid());
CREATE POLICY "Managers and admins can manage tasks" ON public.tasks FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid())) AND get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Time Entry RLS Policies
CREATE POLICY "Users can manage their own time entries" ON public.time_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins/Managers can view all company time entries" ON public.time_entries FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'manager') AND user_id IN (SELECT id FROM public.profiles WHERE company_id = get_user_company_id(auth.uid())));

-- Material RLS Policies
CREATE POLICY "Users can view materials in their company" ON public.materials FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Managers and admins can manage materials" ON public.materials FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Project Material RLS Policies
CREATE POLICY "Users can manage materials on projects in their company" ON public.project_materials FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid())));

-- Employee Invitation RLS Policies
CREATE POLICY "Admins can manage invitations for their company" ON public.employee_invitations FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- Insert sample data for testing
INSERT INTO public.companies (name, address, phone, email) VALUES 
('Muster Handwerksbetrieb GmbH', 'Musterstraße 123, 12345 Musterstadt', '+49 123 456789', 'info@muster-handwerk.de');

-- Note: Sample users will be created through the registration process 