export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { email, first_name, last_name, role = 'employee' } = body

    if (!email || !first_name || !last_name) {
      return NextResponse.json({ 
        error: 'E-Mail, Vorname und Nachname sind erforderlich' 
      }, { status: 400 })
    }

    // Get current user and company
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Ein Nutzer mit dieser E-Mail existiert bereits' 
      }, { status: 400 })
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('employee_invitations')
      .insert({
        company_id: profile.company_id,
        email,
        first_name,
        last_name,
        role
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    // Here you would send an email with the invitation link
    // For now, we'll return the invitation token
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${invitation.invitation_token}`

    return NextResponse.json({
      invitation,
      inviteLink,
      message: `Einladung für ${first_name} ${last_name} wurde erstellt`
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 