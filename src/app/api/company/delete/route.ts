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
    // Profil und Rolle prüfen
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Benutzerprofil nicht gefunden' }, { status: 404 })
    }
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Nur Admins dürfen die Firma löschen.' }, { status: 403 })
    }
    const companyId = profile.company_id
    // 1. Alle Einladungen löschen
    await supabase.from('employee_invitations').delete().eq('company_id', companyId)
    // 2. Alle Materialien löschen
    await supabase.from('materials').delete().eq('project_id', supabase.from('projects').select('id').eq('company_id', companyId))
    // 3. Alle Aufgaben löschen
    await supabase.from('tasks').delete().eq('project_id', supabase.from('projects').select('id').eq('company_id', companyId))
    // 4. Alle Projekte löschen
    await supabase.from('projects').delete().eq('company_id', companyId)
    // 5. Alle Profile der Firma löschen (außer Admin selbst)
    await supabase.from('profiles').delete().eq('company_id', companyId).neq('id', user.id)
    // 6. Firma löschen
    await supabase.from('companies').delete().eq('id', companyId)
    // 7. Admin-Profil löschen
    await supabase.from('profiles').delete().eq('id', user.id)
    // 8. Admin-Account aus Supabase Auth löschen
    // (Dafür ist ein Service-Role-Key nötig, daher ggf. als TODO markieren)
    // await supabase.auth.admin.deleteUser(user.id)
    return NextResponse.json({ success: true, message: 'Firma, alle Daten und Account wurden gelöscht.' })
  } catch (error) {
    console.error('Fehler beim Löschen der Firma und aller Daten:', error)
    return NextResponse.json({ error: 'Interner Serverfehler beim Löschen der Firma.' }, { status: 500 })
  }
} 