-- Bauflow Database Schema
-- Erweiterte Version mit Authentifizierung und Firmenverwaltung

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Mitarbeiter
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    initials VARCHAR(4),
    color VARCHAR(16),
    role VARCHAR(32) DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kunden
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projekte
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    description TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Termine
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    description TEXT,
    location TEXT,
    start TIMESTAMP WITH TIME ZONE NOT NULL,
    end TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) DEFAULT 'geplant',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Termin-Mitarbeiter-Zuordnung (Mehrfachzuweisung)
CREATE TABLE public.appointment_employees (
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    PRIMARY KEY (appointment_id, employee_id)
);

-- Materialien
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(32),
    price_per_unit DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Termin-Material-Zuordnung
CREATE TABLE public.appointment_materials (
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (appointment_id, material_id)
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
CREATE INDEX idx_employee_absences_user_id ON public.employee_absences(user_id);
CREATE INDEX idx_employee_absences_company_id ON public.employee_absences(company_id);
CREATE INDEX idx_employee_absences_start_date ON public.employee_absences(start_date);
CREATE INDEX idx_employee_absences_end_date ON public.employee_absences(end_date);

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
CREATE TRIGGER update_employee_absences_updated_at BEFORE UPDATE ON public.employee_absences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper Functions to prevent RLS recursion
-- These functions are SECURITY DEFINER, which means they bypass RLS checks
-- and can safely query user data without causing an infinite loop.

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
DROP POLICY IF EXISTS "Users can view employee absences" ON public.employee_absences;
DROP POLICY IF EXISTS "Managers and admins can manage employee absences" ON public.employee_absences;


ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_absences ENABLE ROW LEVEL SECURITY;

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

-- Employee Absence RLS Policies
CREATE POLICY "Users can view employee absences" ON public.employee_absences FOR SELECT USING (user_id = auth.uid() OR company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Managers and admins can manage employee absences" ON public.employee_absences FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Insert sample data for testing
INSERT INTO public.companies (name, address, phone, email) VALUES 
('Muster Handwerksbetrieb GmbH', 'Musterstraße 123, 12345 Musterstadt', '+49 123 456789', 'info@muster-handwerk.de');

-- Note: Sample users will be created through the registration process 

-- Entferne die Spalten start_time und end_time aus der Tabelle public.tasks
ALTER TABLE public.tasks DROP COLUMN IF EXISTS start_time;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS end_time; 