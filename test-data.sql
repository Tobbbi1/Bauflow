-- Test-Daten für Kalender
-- Zuerst eine Test-Firma erstellen
INSERT INTO public.companies (id, name, address, phone, email) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Test Bau GmbH',
  'Musterstraße 123, 12345 Musterstadt',
  '+49 123 456789',
  'info@testbau.de'
) ON CONFLICT (id) DO NOTHING;

-- Test-Benutzer Profil erstellen (falls noch nicht vorhanden)
INSERT INTO public.profiles (id, company_id, first_name, last_name, role, email_verified)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Max',
  'Mustermann',
  'admin',
  true
) ON CONFLICT (id) DO NOTHING;

-- Test-Projekte (Baustellen) erstellen
INSERT INTO public.projects (id, name, address, description, start_date, end_date, status, color, company_id, created_by)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'Wohnhaus Neubau',
    'Hauptstraße 45, 12345 Musterstadt',
    'Einfamilienhaus mit Keller und Garage',
    '2024-01-15',
    '2024-06-30',
    'in_progress',
    '#3B82F6',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'Bürogebäude Sanierung',
    'Industriestraße 78, 12345 Musterstadt',
    'Komplette Sanierung des 3-stöckigen Bürogebäudes',
    '2024-02-01',
    '2024-08-15',
    'planning',
    '#10B981',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'Kindergarten Erweiterung',
    'Schulstraße 12, 12345 Musterstadt',
    'Anbau für 2 weitere Gruppenräume',
    '2024-03-01',
    '2024-09-30',
    'planning',
    '#F59E0B',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001'
  )
ON CONFLICT (id) DO NOTHING;

-- Test-Aufgaben erstellen
INSERT INTO public.tasks (id, title, description, project_id, assigned_to, status, priority, start_date, end_date, start_time, end_time, color)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440005',
    'Fundament gießen',
    'Betonfundament für das Wohnhaus vorbereiten und gießen',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'in_progress',
    'high',
    '2024-01-15',
    '2024-01-20',
    '08:00',
    '16:00',
    '#3B82F6'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440006',
    'Mauern errichten',
    'Außenwände und Innenwände mauern',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'pending',
    'medium',
    '2024-01-25',
    '2024-02-15',
    '07:00',
    '15:00',
    '#3B82F6'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440007',
    'Dachstuhl montieren',
    'Holzdachstuhl aufsetzen und befestigen',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'pending',
    'high',
    '2024-02-20',
    '2024-03-10',
    '07:00',
    '15:00',
    '#3B82F6'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440008',
    'Planung Bürogebäude',
    'Detaillierte Planung der Sanierungsarbeiten',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'in_progress',
    'urgent',
    '2024-02-01',
    '2024-02-28',
    '09:00',
    '17:00',
    '#10B981'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440009',
    'Elektroinstallation planen',
    'Elektrische Anlagen für das Bürogebäude planen',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'pending',
    'medium',
    '2024-03-01',
    '2024-03-15',
    '08:00',
    '16:00',
    '#10B981'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440010',
    'Genehmigung einholen',
    'Baugenehmigung für Kindergarten-Erweiterung beantragen',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    'pending',
    'urgent',
    '2024-03-01',
    '2024-04-30',
    '09:00',
    '17:00',
    '#F59E0B'
  )
ON CONFLICT (id) DO NOTHING; 