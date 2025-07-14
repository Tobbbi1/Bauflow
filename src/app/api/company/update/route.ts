export const dynamic = "force-dynamic"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Authentifizierung prüfen
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Benutzer-Profil laden
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 })
    }

    // Nur Admins und Manager können Firmen-Daten bearbeiten
    if (profile.role !== 'admin' && profile.role !== 'manager') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, phone, email, website, logo_url } = body

    // Validierung
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Firmenname ist erforderlich' }, { status: 400 })
    }

    // Firmen-Daten aktualisieren
    const { data, error } = await supabase
      .from('companies')
      .update({
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        logo_url: logo_url?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.company_id)
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Aktualisieren der Firmen-Daten:', error)
      return NextResponse.json({ error: 'Fehler beim Speichern der Daten' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      company: data,
      message: 'Firmen-Daten erfolgreich aktualisiert'
    })

  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Authentifizierung prüfen
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Benutzer-Profil laden
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 })
    }

    // Firmen-Daten laden
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()

    if (companyError) {
      console.error('Fehler beim Laden der Firmen-Daten:', companyError)
      return NextResponse.json({ error: 'Fehler beim Laden der Daten' }, { status: 500 })
    }

    return NextResponse.json({ company })

  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
} 