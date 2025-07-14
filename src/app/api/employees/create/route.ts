export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { first_name, last_name, email, role, user_id, company_id, initials, color, phone, hourly_rate } = body

    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'Vorname und Nachname sind erforderlich' }, { status: 400 })
    }

    // Get current user for authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // If no company_id provided, get it from current user's profile
    let finalCompanyId = company_id
    if (!finalCompanyId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (profile?.company_id) {
        finalCompanyId = profile.company_id
      } else {
        return NextResponse.json({ error: 'Keine Firma gefunden' }, { status: 400 })
      }
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .insert({
        company_id: finalCompanyId,
        user_id: user_id || null,
        first_name,
        last_name,
        email,
        role: role || 'mitarbeiter',
        initials: initials || (first_name[0] + last_name[0]).toUpperCase(),
        color: color || '#3B82F6',
        phone: phone || null,
        hourly_rate: hourly_rate || 40.00
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating employee:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: employee, message: 'Mitarbeiter erfolgreich erstellt' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 