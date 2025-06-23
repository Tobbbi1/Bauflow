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

    const { first_name, last_name, email, password } = await request.json()
    
    // Benutzerprofil und Berechtigungen prüfen
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Benutzerprofil nicht gefunden' }, { status: 404 })
    }

    // Prüfen ob Benutzer Admin ist
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Keine Berechtigung zum Erstellen von Mitarbeitern' }, { status: 403 })
    }

    // Prüfen ob E-Mail bereits existiert
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const emailExists = existingUser.users.some(u => u.email === email)
    
    if (emailExists) {
      return NextResponse.json({ error: 'E-Mail-Adresse bereits registriert' }, { status: 400 })
    }

    // Mitarbeiter in Supabase Auth erstellen
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // E-Mail automatisch bestätigen
      user_metadata: {
        firstName: first_name,
        lastName: last_name,
        role: 'employee',
        companyId: profile.company_id,
        emailVerified: true
      }
    })

    if (createUserError) {
      console.error('Fehler beim Erstellen des Mitarbeiters:', createUserError)
      return NextResponse.json({ error: 'Fehler beim Erstellen des Mitarbeiters' }, { status: 500 })
    }

    return NextResponse.json({ 
      data: {
        id: newUser.user.id,
        email: newUser.user.email,
        first_name,
        last_name,
        role: 'employee'
      }
    })
  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 