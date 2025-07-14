export const dynamic = "force-dynamic"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
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
    // Alle Abwesenheiten der Firma laden
    const { data, error } = await supabase
      .from('employee_absences')
      .select('id, user_id, type, description, start_date, end_date, status, created_at, updated_at')
      .eq('company_id', profile.company_id)
    if (error) {
      return NextResponse.json({ error: 'Fehler beim Laden der Abwesenheiten' }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 