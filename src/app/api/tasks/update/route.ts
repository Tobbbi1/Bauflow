import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Authentifizierung prüfen
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { id, ...updateData } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Aufgaben-ID erforderlich' }, { status: 400 })
    }

    // Benutzerprofil und Berechtigungen prüfen
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Benutzerprofil nicht gefunden' }, { status: 404 })
    }

    // Prüfen ob Benutzer Admin oder Manager ist, oder ob er der zugewiesene Mitarbeiter ist
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('assigned_to, project_id')
      .eq('id', id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Aufgabe nicht gefunden' }, { status: 404 })
    }

    // Prüfen ob das Projekt zur Firma gehört
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', task.project_id)
      .eq('company_id', profile.company_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Keine Berechtigung für diese Aufgabe' }, { status: 403 })
    }

    // Berechtigung prüfen: Admin/Manager oder zugewiesener Mitarbeiter
    const canEdit = ['admin', 'manager'].includes(profile.role) || task.assigned_to === user.id

    if (!canEdit) {
      return NextResponse.json({ error: 'Keine Berechtigung zum Bearbeiten dieser Aufgabe' }, { status: 403 })
    }

    // Aufgabe aktualisieren
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Aktualisieren der Aufgabe:', error)
      return NextResponse.json({ error: 'Fehler beim Aktualisieren der Aufgabe' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 