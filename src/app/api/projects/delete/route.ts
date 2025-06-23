import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Authentifizierung prüfen
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Baustellen-ID erforderlich' }, { status: 400 })
    }

    console.log('Deleting project with ID:', id, 'for user:', user.id)

    // Benutzerprofil und Berechtigungen prüfen
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Benutzerprofil nicht gefunden' }, { status: 404 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Benutzerprofil nicht gefunden' }, { status: 404 })
    }

    console.log('User profile:', profile)

    // Prüfen ob Benutzer Admin oder Manager ist
    if (!['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Keine Berechtigung zum Löschen von Baustellen' }, { status: 403 })
    }

    // Prüfen ob Baustelle zur Firma gehört
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', id)
      .eq('company_id', profile.company_id)
      .single()

    if (projectError) {
      console.error('Project fetch error:', projectError)
      return NextResponse.json({ error: 'Baustelle nicht gefunden' }, { status: 404 })
    }

    if (!project) {
      return NextResponse.json({ error: 'Baustelle nicht gefunden' }, { status: 404 })
    }

    console.log('Found project:', project)

    // Baustelle löschen
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('company_id', profile.company_id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Fehler beim Löschen der Baustelle: ' + deleteError.message }, { status: 500 })
    }

    console.log('Successfully deleted project:', id)
    return NextResponse.json({ success: true, message: 'Baustelle erfolgreich gelöscht' })
  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 