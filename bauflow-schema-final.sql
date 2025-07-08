-- Bauflow Database Schema - Final Multi-Company Version
-- Unterstützt mehrere Firmen mit vollständiger Authentifizierung und RLS

-- Extensions aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alle bestehenden Tabellen entfernen (außer auth)
DROP TABLE IF EXISTS public.time_entries CASCADE;
DROP TABLE IF EXISTS public.appointment_materials CASCADE;
DROP TABLE IF EXISTS public.appointment_employees CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.employee_invitations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- User Rollen
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Firmen - Haupttabelle für Multi-Tenancy
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(255),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Profile - Verbindung zwischen auth.users und companies
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    role user_role DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mitarbeiter - Firmen-spezifisch
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    initials VARCHAR(4),
    color VARCHAR(16) DEFAULT '#3B82F6',
    role VARCHAR(32) DEFAULT 'mitarbeiter',
    phone VARCHAR(50),
    email VARCHAR(100),
    hourly_rate DECIMAL(10,2) DEFAULT 40.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mitarbeiter-Einladungen
CREATE TABLE public.employee_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'employee',
    invitation_token UUID DEFAULT uuid_generate_v4(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kunden - Firmen-spezifisch
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projekte (Baustellen) - Firmen-spezifisch
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    description TEXT,
    address TEXT,
    color VARCHAR(16) DEFAULT '#10B981',
    status VARCHAR(32) DEFAULT 'aktiv' CHECK (status IN ('geplant', 'aktiv', 'pausiert', 'abgeschlossen')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Termine für Baustellen - Firmen-spezifisch
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) DEFAULT 'geplant' CHECK (status IN ('geplant', 'laufend', 'erledigt', 'abgesagt')),
    color VARCHAR(16),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Termin-Mitarbeiter-Zuordnung
CREATE TABLE public.appointment_employees (
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    PRIMARY KEY (appointment_id, employee_id)
);

-- Stundenzettel - Firmen-spezifisch
CREATE TABLE public.time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INTEGER DEFAULT 0,
    total_hours DECIMAL(4,2) GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0 - (break_minutes / 60.0)
    ) STORED,
    description TEXT,
    hourly_rate DECIMAL(10,2),
    total_cost DECIMAL(12,2) GENERATED ALWAYS AS (
        (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0 - (break_minutes / 60.0)) * COALESCE(hourly_rate, 40.00)
    ) STORED,
    approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materialien - Firmen-spezifisch
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(32),
    price_per_unit DECIMAL(10,2),
    supplier VARCHAR(255),
    stock_quantity DECIMAL(10,2) DEFAULT 0,
    min_stock_level DECIMAL(10,2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Material-Verbrauch pro Termin
CREATE TABLE public.appointment_materials (
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_price, 0)) STORED,
    notes TEXT,
    PRIMARY KEY (appointment_id, material_id)
);

-- Indizes für Performance
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_employees_company_id ON public.employees(company_id);
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_customers_company_id ON public.customers(company_id);
CREATE INDEX idx_projects_company_id ON public.projects(company_id);
CREATE INDEX idx_appointments_company_id ON public.appointments(company_id);
CREATE INDEX idx_time_entries_company_id ON public.time_entries(company_id);
CREATE INDEX idx_time_entries_employee_date ON public.time_entries(employee_id, date);
CREATE INDEX idx_materials_company_id ON public.materials(company_id);
CREATE INDEX idx_employee_invitations_token ON public.employee_invitations(invitation_token);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper Functions für RLS
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

-- Trigger für automatische Farben und Stundensätze
CREATE OR REPLACE FUNCTION set_appointment_color_from_project()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.color IS NULL AND NEW.project_id IS NOT NULL THEN
    SELECT color INTO NEW.color FROM public.projects WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_appointment_color_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_appointment_color_from_project();

CREATE OR REPLACE FUNCTION set_time_entry_hourly_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hourly_rate IS NULL THEN
    SELECT hourly_rate INTO NEW.hourly_rate FROM public.employees WHERE id = NEW.employee_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_time_entry_hourly_rate_trigger
  BEFORE INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION set_time_entry_hourly_rate();

-- RLS aktivieren
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Companies - Nutzer können nur ihre eigene Firma sehen/bearbeiten
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can update their company" ON public.companies FOR UPDATE USING (id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Allow company creation during signup" ON public.companies FOR INSERT WITH CHECK (true);

-- Profiles - Nutzer können ihre eigenen Profile und Firmenkollegen sehen
CREATE POLICY "Users can view their profile and company members" ON public.profiles FOR SELECT USING (id = auth.uid() OR company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Allow profile creation during signup" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage company profiles" ON public.profiles FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- Employees - Firmen-basierte Zugriffe
CREATE POLICY "Users can view employees in their company" ON public.employees FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins and managers can manage employees" ON public.employees FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Employee Invitations - Nur Admins können einladen
CREATE POLICY "Admins can manage invitations" ON public.employee_invitations FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- Customers - Firmen-basierte Zugriffe
CREATE POLICY "Users can view customers in their company" ON public.customers FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins and managers can manage customers" ON public.customers FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Projects - Firmen-basierte Zugriffe
CREATE POLICY "Users can view projects in their company" ON public.projects FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins and managers can manage projects" ON public.projects FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Appointments - Nutzer sehen nur ihre zugewiesenen Termine oder alle als Admin/Manager
CREATE POLICY "Employees can view their assigned appointments" ON public.appointments FOR SELECT USING (
  company_id = get_user_company_id(auth.uid()) AND (
    get_user_role(auth.uid()) IN ('admin', 'manager') OR 
    id IN (SELECT appointment_id FROM appointment_employees ae JOIN employees e ON ae.employee_id = e.id WHERE e.user_id = auth.uid())
  )
);
CREATE POLICY "Admins and managers can manage appointments" ON public.appointments FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Appointment Employees - Firmen-basierte Zugriffe
CREATE POLICY "Users can view appointment assignments in their company" ON public.appointment_employees FOR SELECT USING (
  appointment_id IN (SELECT id FROM appointments WHERE company_id = get_user_company_id(auth.uid()))
);
CREATE POLICY "Admins and managers can manage appointment assignments" ON public.appointment_employees FOR ALL USING (
  appointment_id IN (SELECT id FROM appointments WHERE company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'manager'))
);

-- Time Entries - Nutzer können nur ihre eigenen sehen, Admins/Manager alle der Firma
CREATE POLICY "Employees can manage their own time entries" ON public.time_entries FOR ALL USING (
  company_id = get_user_company_id(auth.uid()) AND (
    get_user_role(auth.uid()) IN ('admin', 'manager') OR
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  )
);

-- Materials - Firmen-basierte Zugriffe
CREATE POLICY "Users can view materials in their company" ON public.materials FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins and managers can manage materials" ON public.materials FOR ALL USING (company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Appointment Materials - Firmen-basierte Zugriffe
CREATE POLICY "Users can view appointment materials in their company" ON public.appointment_materials FOR SELECT USING (
  appointment_id IN (SELECT id FROM appointments WHERE company_id = get_user_company_id(auth.uid()))
);
CREATE POLICY "Admins and managers can manage appointment materials" ON public.appointment_materials FOR ALL USING (
  appointment_id IN (SELECT id FROM appointments WHERE company_id = get_user_company_id(auth.uid()) AND get_user_role(auth.uid()) IN ('admin', 'manager'))
); 