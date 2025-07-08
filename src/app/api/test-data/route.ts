import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Prüfe, ob der Benutzer angemeldet ist
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    // Test-Daten einfügen
    const testData = `
      -- Test-Firma erstellen
      INSERT INTO public.companies (id, name, address, phone, email) 
      VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        'Test Bau GmbH',
        'Musterstraße 123, 12345 Musterstadt',
        '+49 123 456789',
        'info@testbau.de'
      ) ON CONFLICT (id) DO NOTHING;

      -- Test-Projekte erstellen
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
          '${user.id}'
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
          '${user.id}'
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
          '${user.id}'
        )
      ON CONFLICT (id) DO NOTHING;

      -- Test-Aufgaben erstellen (ohne start_time/end_time, assigned_to kann NULL sein)
      INSERT INTO public.tasks (id, title, description, project_id, assigned_to, status, priority, start_date, end_date, color)
      VALUES 
        (
          '550e8400-e29b-41d4-a716-446655440005',
          'Fundament gießen',
          'Betonfundament für das Wohnhaus vorbereiten und gießen',
          '550e8400-e29b-41d4-a716-446655440002',
          '${user.id}',
          'in_progress',
          'high',
          '2024-01-15',
          '2024-01-20',
          '#3B82F6'
        ),
        (
          '550e8400-e29b-41d4-a716-446655440006',
          'Mauern errichten',
          'Außenwände und Innenwände mauern',
          '550e8400-e29b-41d4-a716-446655440002',
          NULL,
          'pending',
          'medium',
          '2024-01-25',
          '2024-02-15',
          '#3B82F6'
        ),
        (
          '550e8400-e29b-41d4-a716-446655440007',
          'Dachstuhl montieren',
          'Holzdachstuhl aufsetzen und befestigen',
          '550e8400-e29b-41d4-a716-446655440002',
          '${user.id}',
          'pending',
          'high',
          '2024-02-20',
          '2024-03-10',
          '#3B82F6'
        ),
        (
          '550e8400-e29b-41d4-a716-446655440008',
          'Planung Bürogebäude',
          'Detaillierte Planung der Sanierungsarbeiten',
          '550e8400-e29b-41d4-a716-446655440003',
          NULL,
          'in_progress',
          'urgent',
          '2024-02-01',
          '2024-02-28',
          '#10B981'
        ),
        (
          '550e8400-e29b-41d4-a716-446655440009',
          'Elektroinstallation planen',
          'Elektrische Anlagen für das Bürogebäude planen',
          '550e8400-e29b-41d4-a716-446655440003',
          '${user.id}',
          'pending',
          'medium',
          '2024-03-01',
          '2024-03-15',
          '#10B981'
        ),
        (
          '550e8400-e29b-41d4-a716-446655440010',
          'Genehmigung einholen',
          'Baugenehmigung für Kindergarten-Erweiterung beantragen',
          '550e8400-e29b-41d4-a716-446655440004',
          NULL,
          'pending',
          'urgent',
          '2024-03-01',
          '2024-04-30',
          '#F59E0B'
        )
      ON CONFLICT (id) DO NOTHING;
    `

    // Führe die SQL-Befehle aus
    const { error } = await supabase.rpc('exec_sql', { sql: testData })
    
    if (error) {
      console.error('Fehler beim Einfügen der Test-Daten:', error)
      return NextResponse.json({ error: 'Fehler beim Einfügen der Test-Daten' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Test-Daten erfolgreich eingefügt' })
  } catch (error) {
    console.error('Fehler:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
} 