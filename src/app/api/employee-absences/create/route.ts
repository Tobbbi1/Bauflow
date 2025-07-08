import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }
    const body = await request.json()
    const { type, description, start_date, end_date } = body
    if (!type || !start_date || !end_date) {
      return NextResponse.json({ error: 'Typ, Start- und Enddatum sind erforderlich' }, { status: 400 })
    }
    // Profil und Firma laden
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 })
    }
    // Abwesenheit anlegen
    const { data, error } = await supabase
      .from('employee_absences')
      .insert({
        user_id: user.id,
        company_id: profile.company_id,
        type,
        description: description || null,
        start_date,
        end_date,
        status: 'beantragt',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: 'Fehler beim Anlegen der Abwesenheit' }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 