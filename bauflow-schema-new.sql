-- Bauflow Database Schema - Complete Rebuild
-- Alles entfernt außer Authentifizierung, neue Struktur für Apple Kalender-Style

-- Extensions aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alle bestehenden Tabellen entfernen (außer auth)
DROP TABLE IF EXISTS public.appointment_materials CASCADE;
DROP TABLE IF EXISTS public.appointment_employees CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.employee_absences CASCADE;
DROP TABLE IF EXISTS public.employee_invitations CASCADE;
DROP TABLE IF EXISTS public.project_materials CASCADE;
DROP TABLE IF EXISTS public.time_entries CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- Mitarbeiter - Basis für den Kalender
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    initials VARCHAR(4),
    color VARCHAR(16) DEFAULT '#3B82F6',
    role VARCHAR(32) DEFAULT 'mitarbeiter',
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

-- Projekte (Baustellen)
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    description TEXT,
    address TEXT,
    color VARCHAR(16) DEFAULT '#10B981',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Termine (Appointments) - Haupttabelle für Kalender
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) DEFAULT 'geplant' CHECK (status IN ('geplant', 'erledigt', 'dokumentiert')),
    color VARCHAR(16),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Termin-Mitarbeiter-Zuordnung (many-to-many)
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

-- Indizes für Performance
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_appointments_end_time ON public.appointments(end_time);
CREATE INDEX idx_appointments_project_id ON public.appointments(project_id);
CREATE INDEX idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX idx_appointment_employees_appointment_id ON public.appointment_employees(appointment_id);
CREATE INDEX idx_appointment_employees_employee_id ON public.appointment_employees(employee_id);
CREATE INDEX idx_projects_customer_id ON public.projects(customer_id);

-- Trigger für Farben basierend auf Projekten
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

-- RLS aktivieren
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_materials ENABLE ROW LEVEL SECURITY;

-- Einfache RLS Policies (alle Nutzer können alles sehen und bearbeiten)
CREATE POLICY "Allow all for employees" ON public.employees FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for customers" ON public.customers FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for projects" ON public.projects FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for appointments" ON public.appointments FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for appointment_employees" ON public.appointment_employees FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for materials" ON public.materials FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for appointment_materials" ON public.appointment_materials FOR ALL USING (auth.uid() IS NOT NULL);

-- Test-Daten einfügen
INSERT INTO public.employees (first_name, last_name, initials, color, role) VALUES 
('Max', 'Mustermann', 'MM', '#3B82F6', 'vorarbeiter'),
('Anna', 'Schmidt', 'AS', '#EF4444', 'mitarbeiter'),
('Peter', 'Weber', 'PW', '#10B981', 'mitarbeiter'),
('Lisa', 'Müller', 'LM', '#F59E0B', 'auszubildende');

INSERT INTO public.customers (name, address, contact_person, contact_phone, contact_email) VALUES 
('Familie Muster', 'Musterstraße 1, 12345 Musterstadt', 'Hans Muster', '+49 123 456789', 'hans@muster.de'),
('Firma ABC GmbH', 'Industriestraße 10, 54321 Beispielstadt', 'Maria Beispiel', '+49 987 654321', 'maria@abc.de'),
('Restaurant Zur Post', 'Hauptstraße 25, 98765 Gaststadt', 'Karl Wirt', '+49 555 123456', 'karl@zurpost.de');

INSERT INTO public.projects (name, customer_id, description, address, color) VALUES 
('Badezimmer Renovierung', (SELECT id FROM public.customers WHERE name = 'Familie Muster'), 'Komplette Sanierung des Hauptbadezimmers', 'Musterstraße 1, 12345 Musterstadt', '#8B5CF6'),
('Büro Umbau', (SELECT id FROM public.customers WHERE name = 'Firma ABC GmbH'), 'Umbau der Büroräume im 2. Stock', 'Industriestraße 10, 54321 Beispielstadt', '#06B6D4'),
('Küche Modernisierung', (SELECT id FROM public.customers WHERE name = 'Restaurant Zur Post'), 'Neue Küchenausstattung und Elektrik', 'Hauptstraße 25, 98765 Gaststadt', '#EC4899');

INSERT INTO public.materials (name, description, unit, price_per_unit) VALUES 
('Fliesen 30x30cm', 'Weiße Wandfliesen für Badezimmer', 'm²', 25.50),
('Laminat Eiche', 'Laminatboden in Eiche-Optik', 'm²', 18.90),
('Kabel NYM-J 3x1,5', 'Elektrokabel für Hausinstallation', 'm', 2.30),
('Spachtelmasse', 'Fertigspachtel für Wandreparaturen', 'kg', 8.75);

-- Beispiel-Termine für heute und nächste Woche
INSERT INTO public.appointments (title, project_id, customer_id, description, location, start_time, end_time, status) VALUES 
('Fliesen verlegen', 
 (SELECT id FROM public.projects WHERE name = 'Badezimmer Renovierung'),
 (SELECT id FROM public.customers WHERE name = 'Familie Muster'),
 'Verlegung der Wandfliesen im Badezimmer',
 'Musterstraße 1, 12345 Musterstadt',
 NOW() + INTERVAL '1 hour',
 NOW() + INTERVAL '5 hours',
 'geplant'),
('Elektrik prüfen',
 (SELECT id FROM public.projects WHERE name = 'Büro Umbau'),
 (SELECT id FROM public.customers WHERE name = 'Firma ABC GmbH'),
 'Überprüfung der vorhandenen Elektroinstallation',
 'Industriestraße 10, 54321 Beispielstadt',
 NOW() + INTERVAL '1 day',
 NOW() + INTERVAL '1 day 3 hours',
 'geplant'),
('Küchenmontage',
 (SELECT id FROM public.projects WHERE name = 'Küche Modernisierung'),
 (SELECT id FROM public.customers WHERE name = 'Restaurant Zur Post'),
 'Montage der neuen Küchenzeile',
 'Hauptstraße 25, 98765 Gaststadt',
 NOW() + INTERVAL '2 days',
 NOW() + INTERVAL '2 days 6 hours',
 'geplant');

-- Mitarbeiter zu Terminen zuweisen
INSERT INTO public.appointment_employees (appointment_id, employee_id) VALUES 
((SELECT id FROM public.appointments WHERE title = 'Fliesen verlegen'), (SELECT id FROM public.employees WHERE first_name = 'Max')),
((SELECT id FROM public.appointments WHERE title = 'Fliesen verlegen'), (SELECT id FROM public.employees WHERE first_name = 'Anna')),
((SELECT id FROM public.appointments WHERE title = 'Elektrik prüfen'), (SELECT id FROM public.employees WHERE first_name = 'Peter')),
((SELECT id FROM public.appointments WHERE title = 'Küchenmontage'), (SELECT id FROM public.employees WHERE first_name = 'Max')),
((SELECT id FROM public.appointments WHERE title = 'Küchenmontage'), (SELECT id FROM public.employees WHERE first_name = 'Lisa')); 