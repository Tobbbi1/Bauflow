-- Bauflow Database Schema - Updated for Construction Site Management
-- Fokus auf Baustellen, Termine und Stundenzettel

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
DROP TABLE IF EXISTS public.employee_absences CASCADE;
DROP TABLE IF EXISTS public.employee_invitations CASCADE;
DROP TABLE IF EXISTS public.project_materials CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- Mitarbeiter - Basis für das System
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Kunden
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projekte (Baustellen) - Haupttabelle
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Termine für Baustellen
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Stundenzettel - Kernfunktion für Arbeitszeiterfassung
CREATE TABLE public.time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Materialien
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_time_entries_employee_date ON public.time_entries(employee_id, date);
CREATE INDEX idx_time_entries_project_date ON public.time_entries(project_id, date);
CREATE INDEX idx_time_entries_date ON public.time_entries(date);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_appointments_end_time ON public.appointments(end_time);
CREATE INDEX idx_appointments_project_id ON public.appointments(project_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_customer_id ON public.projects(customer_id);

-- Trigger für automatische Farben
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

-- Trigger für automatische Stundensätze
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
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_materials ENABLE ROW LEVEL SECURITY;

-- Einfache RLS Policies (alle authentifizierten Nutzer können alles)
CREATE POLICY "Allow all for employees" ON public.employees FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for customers" ON public.customers FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for projects" ON public.projects FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for appointments" ON public.appointments FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for appointment_employees" ON public.appointment_employees FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for time_entries" ON public.time_entries FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for materials" ON public.materials FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all for appointment_materials" ON public.appointment_materials FOR ALL USING (auth.uid() IS NOT NULL);

-- Test-Daten einfügen
INSERT INTO public.employees (first_name, last_name, initials, color, role, phone, email, hourly_rate) VALUES 
('Max', 'Mustermann', 'MM', '#3B82F6', 'vorarbeiter', '+49 123 456789', 'max@bauflow.de', 45.00),
('Anna', 'Schmidt', 'AS', '#EF4444', 'mitarbeiter', '+49 123 456790', 'anna@bauflow.de', 38.00),
('Peter', 'Weber', 'PW', '#10B981', 'elektriker', '+49 123 456791', 'peter@bauflow.de', 42.00),
('Lisa', 'Müller', 'LM', '#F59E0B', 'auszubildende', '+49 123 456792', 'lisa@bauflow.de', 18.00);

INSERT INTO public.customers (name, address, contact_person, contact_phone, contact_email, notes) VALUES 
('Familie Muster', 'Musterstraße 1, 12345 Musterstadt', 'Hans Muster', '+49 123 456789', 'hans@muster.de', 'Stammkunde seit 2020'),
('Firma ABC GmbH', 'Industriestraße 10, 54321 Beispielstadt', 'Maria Beispiel', '+49 987 654321', 'maria@abc.de', 'Großkunde - Büroräume'),
('Restaurant Zur Post', 'Hauptstraße 25, 98765 Gaststadt', 'Karl Wirt', '+49 555 123456', 'karl@zurpost.de', 'Gastronomie-Projekt');

INSERT INTO public.projects (name, customer_id, description, address, color, status, start_date, budget) VALUES 
('Badezimmer Renovierung', 
 (SELECT id FROM public.customers WHERE name = 'Familie Muster'), 
 'Komplette Sanierung des Hauptbadezimmers mit neuen Fliesen und Sanitäranlagen', 
 'Musterstraße 1, 12345 Musterstadt', 
 '#8B5CF6', 
 'aktiv',
 '2024-01-10',
 15000.00),
('Büro Umbau Etage 2', 
 (SELECT id FROM public.customers WHERE name = 'Firma ABC GmbH'), 
 'Umbau der Büroräume im 2. Stock - neue Wände, Elektrik und Bodenbeläge', 
 'Industriestraße 10, 54321 Beispielstadt', 
 '#06B6D4', 
 'aktiv',
 '2024-01-15',
 35000.00),
('Küche Modernisierung', 
 (SELECT id FROM public.customers WHERE name = 'Restaurant Zur Post'), 
 'Neue Küchenausstattung, Elektrik und Lüftungsanlage für Profi-Küche', 
 'Hauptstraße 25, 98765 Gaststadt', 
 '#EC4899', 
 'geplant',
 '2024-02-01',
 28000.00);

INSERT INTO public.materials (name, description, unit, price_per_unit, supplier, stock_quantity, min_stock_level) VALUES 
('Fliesen 30x30cm weiß', 'Hochwertige Wandfliesen für Badezimmer, matt weiß', 'm²', 25.50, 'Fliesen Schmidt GmbH', 50.0, 10.0),
('Laminat Eiche natur', 'Laminatboden in Eiche-Optik, Klasse 32', 'm²', 18.90, 'Boden König', 80.0, 20.0),
('Kabel NYM-J 3x1,5', 'Elektrokabel für Hausinstallation, 100m Rolle', 'm', 2.30, 'Elektro Müller', 500.0, 100.0),
('Spachtelmasse innen', 'Fertigspachtel für Wandreparaturen, 25kg Sack', 'kg', 8.75, 'Baustoff Wagner', 200.0, 50.0),
('Sanitärsilikon transparent', 'Hochwertiger Sanitärkleber für Fugen', 'Stück', 4.50, 'Sanitär Profi', 25.0, 5.0);

-- Beispiel-Termine
INSERT INTO public.appointments (title, project_id, customer_id, description, location, start_time, end_time, status) VALUES 
('Fliesen Badezimmer verlegen', 
 (SELECT id FROM public.projects WHERE name = 'Badezimmer Renovierung'),
 (SELECT id FROM public.customers WHERE name = 'Familie Muster'),
 'Verlegung der Wandfliesen im Badezimmer - Vorbereitung am Vortag erforderlich',
 'Musterstraße 1, 12345 Musterstadt, Badezimmer OG',
 '2024-01-20 08:00:00+01',
 '2024-01-20 16:00:00+01',
 'geplant'),
('Elektroinstallation prüfen', 
 (SELECT id FROM public.projects WHERE name = 'Büro Umbau Etage 2'),
 (SELECT id FROM public.customers WHERE name = 'Firma ABC GmbH'),
 'Überprüfung der vorhandenen Elektroinstallation und Planung neuer Leitungen',
 'Industriestraße 10, 54321 Beispielstadt, 2. Etage',
 '2024-01-21 10:00:00+01',
 '2024-01-21 15:00:00+01',
 'geplant'),
('Küche Bestandsaufnahme',
 (SELECT id FROM public.projects WHERE name = 'Küche Modernisierung'),
 (SELECT id FROM public.customers WHERE name = 'Restaurant Zur Post'),
 'Aufmaß und Bestandsaufnahme der bestehenden Küche',
 'Hauptstraße 25, 98765 Gaststadt',
 '2024-01-22 09:00:00+01',
 '2024-01-22 12:00:00+01',
 'geplant');

-- Mitarbeiter zu Terminen zuweisen
INSERT INTO public.appointment_employees (appointment_id, employee_id) VALUES 
((SELECT id FROM public.appointments WHERE title = 'Fliesen Badezimmer verlegen'), (SELECT id FROM public.employees WHERE first_name = 'Max')),
((SELECT id FROM public.appointments WHERE title = 'Fliesen Badezimmer verlegen'), (SELECT id FROM public.employees WHERE first_name = 'Anna')),
((SELECT id FROM public.appointments WHERE title = 'Elektroinstallation prüfen'), (SELECT id FROM public.employees WHERE first_name = 'Peter')),
((SELECT id FROM public.appointments WHERE title = 'Küche Bestandsaufnahme'), (SELECT id FROM public.employees WHERE first_name = 'Max')),
((SELECT id FROM public.appointments WHERE title = 'Küche Bestandsaufnahme'), (SELECT id FROM public.employees WHERE first_name = 'Lisa'));

-- Beispiel-Materialverbrauch
INSERT INTO public.appointment_materials (appointment_id, material_id, quantity, unit_price) VALUES 
((SELECT id FROM public.appointments WHERE title = 'Fliesen Badezimmer verlegen'), 
 (SELECT id FROM public.materials WHERE name = 'Fliesen 30x30cm weiß'), 
 12.5, 25.50),
((SELECT id FROM public.appointments WHERE title = 'Fliesen Badezimmer verlegen'), 
 (SELECT id FROM public.materials WHERE name = 'Sanitärsilikon transparent'), 
 3.0, 4.50);

-- Beispiel-Stundenzettel
INSERT INTO public.time_entries (employee_id, project_id, date, start_time, end_time, break_minutes, description, hourly_rate) VALUES 
((SELECT id FROM public.employees WHERE first_name = 'Max'), 
 (SELECT id FROM public.projects WHERE name = 'Badezimmer Renovierung'),
 '2024-01-18', '08:00', '16:30', 30, 
 'Vorbereitung Fliesenarbeiten - Untergrund prüfen und vorbereiten', 45.00),
((SELECT id FROM public.employees WHERE first_name = 'Anna'), 
 (SELECT id FROM public.projects WHERE name = 'Badezimmer Renovierung'),
 '2024-01-18', '08:30', '16:00', 30, 
 'Unterstützung bei Fliesenvorbereitung und Material sortieren', 38.00),
((SELECT id FROM public.employees WHERE first_name = 'Peter'), 
 (SELECT id FROM public.projects WHERE name = 'Büro Umbau Etage 2'),
 '2024-01-18', '09:00', '17:00', 60, 
 'Elektroplanung und Leitungsverlegung Büro Raum 201-203', 42.00),
((SELECT id FROM public.employees WHERE first_name = 'Max'), 
 (SELECT id FROM public.projects WHERE name = 'Badezimmer Renovierung'),
 '2024-01-19', '08:00', '15:00', 30, 
 'Fliesenverlegung Wand 1-3, Fugenmasse angerührt', 45.00); 