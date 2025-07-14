export const dynamic = "force-dynamic"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Authentifizierung prüfen
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
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

    // Prüfen ob Benutzer Admin oder Manager ist
    if (!['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung zum Löschen von Aufgaben' }, { status: 403 })
    }

    // Prüfen ob die Aufgabe zur Firma gehört
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, project_id')
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

    // Aufgabe löschen
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Fehler beim Löschen der Aufgabe:', error)
      return NextResponse.json({ error: 'Fehler beim Löschen der Aufgabe' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 