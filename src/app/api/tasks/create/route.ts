import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Authentifizierung prüfen
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const taskData = await request.json()
    
    // Benutzerprofil und Berechtigungen prüfen
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Benutzerprofil nicht gefunden' }, { status: 404 })
    }

    // Prüfen ob Benutzer Admin oder Manager ist
    if (!['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung zum Erstellen von Aufgaben' }, { status: 403 })
    }

    // Prüfen ob das Projekt zur Firma gehört
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, color')
      .eq('id', taskData.project_id)
      .eq('company_id', profile.company_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 })
    }

    // Aufgabe erstellen
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        assigned_by: user.id,
        color: project.color, // Farbe vom Projekt übernehmen
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Erstellen der Aufgabe:', error)
      return NextResponse.json({ error: 'Fehler beim Erstellen der Aufgabe' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 