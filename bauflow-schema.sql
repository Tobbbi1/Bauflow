-- Bauflow Database Schema
-- Erweiterte Version mit Authentifizierung und Firmenverwaltung

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Companies table
CREATE TABLE companies (
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
-- This section is now designed to work with Supabase's built-in authentication.

-- Drop dependent objects first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the old users table
DROP TABLE IF EXISTS public.users CASCADE;

-- Create a `profiles` table to store public user data.
-- This table extends Supabase's internal `auth.users` table.
CREATE TABLE public.profiles (
  -- The `id` column matches the `id` of the user in `auth.users`.
  -- It acts as our primary key and a foreign key.
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  
  -- The user's role within the application.
  role user_role NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user, linked to the Supabase auth system.';
COMMENT ON COLUMN public.profiles.id IS 'Links to auth.users.id. Primary key.';


-- Supabase Trigger Function: handle_new_user
-- This function automatically creates a new profile when a user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_id_from_meta UUID;
  user_role_from_meta user_role;
BEGIN
  -- Extract metadata passed during sign-up
  company_id_from_meta := (new.raw_user_meta_data->>'companyId')::UUID;
  user_role_from_meta := (new.raw_user_meta_data->>'role')::user_role;

  -- Create a profile entry for the new user
  INSERT INTO public.profiles (id, first_name, last_name, role, company_id)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'firstName',
    new.raw_user_meta_data->>'lastName',
    COALESCE(user_role_from_meta, 'employee'), -- Default to 'employee' if not provided
    company_id_from_meta
  );
  RETURN new;
END;
$$;

-- Supabase Trigger: on_auth_user_created
-- This trigger calls the function whenever a new user is inserted into `auth.users`.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    address TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'planning',
    budget DECIMAL(10,2),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time tracking table
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials table
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50),
    price_per_unit DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    supplier VARCHAR(255),
    supplier_contact VARCHAR(255),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project materials (many-to-many relationship)
CREATE TABLE project_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(project_id, material_id)
);

-- Employee invitations table
CREATE TABLE employee_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES users(id),
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
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_materials_company_id ON materials(company_id);
CREATE INDEX idx_employee_invitations_email ON employee_invitations(email);
CREATE INDEX idx_employee_invitations_token ON employee_invitations(invitation_token);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_invitations ENABLE ROW LEVEL SECURITY;

-- Company policies
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage their company" ON companies
    FOR ALL USING (id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'));

-- User policies
CREATE POLICY "Users can view company members" ON users
    FOR SELECT USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage company users" ON users
    FOR ALL USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Project policies
CREATE POLICY "Users can view company projects" ON projects
    FOR SELECT USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers and admins can manage projects" ON projects
    FOR ALL USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Task policies
CREATE POLICY "Users can view company tasks" ON tasks
    FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can update assigned tasks" ON tasks
    FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "Managers and admins can manage tasks" ON tasks
    FOR ALL USING (project_id IN (SELECT id FROM projects WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))));

-- Time entry policies
CREATE POLICY "Users can manage their own time entries" ON time_entries
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Managers can view company time entries" ON time_entries
    FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))));

-- Material policies
CREATE POLICY "Users can view company materials" ON materials
    FOR SELECT USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers and admins can manage materials" ON materials
    FOR ALL USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Project materials policies
CREATE POLICY "Users can view project materials" ON project_materials
    FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Managers and admins can manage project materials" ON project_materials
    FOR ALL USING (project_id IN (SELECT id FROM projects WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))));

-- Employee invitation policies
CREATE POLICY "Admins can manage invitations" ON employee_invitations
    FOR ALL USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Policies for profiles table
-- 1. Users can view their own profile.
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 2. Users can update their own profile.
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Admins can view all profiles within their own company.
CREATE POLICY "Admins can view profiles in their own company"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.company_id = profiles.company_id
  )
);

-- Insert sample data for testing
INSERT INTO companies (name, address, phone, email) VALUES 
('Muster Handwerksbetrieb GmbH', 'Musterstraße 123, 12345 Musterstadt', '+49 123 456789', 'info@muster-handwerk.de');

-- Note: Sample users will be created through the registration process 