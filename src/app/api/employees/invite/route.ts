import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { sendEmployeeInvitation } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const {
      email,
      firstName,
      lastName,
      role,
      companyId
    } = body

    // Validate required fields
    if (!email || !companyId) {
      return NextResponse.json(
        { error: 'E-Mail und Firmen-ID sind erforderlich' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits' },
        { status: 400 }
      )
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('employee_invitations')
      .select('id')
      .eq('email', email)
      .eq('company_id', companyId)
      .eq('is_accepted', false)
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Eine Einladung für diese E-Mail-Adresse wurde bereits gesendet' },
        { status: 400 }
      )
    }

    // Get company and inviter info
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single()

    if (!company) {
      return NextResponse.json(
        { error: 'Firma nicht gefunden' },
        { status: 404 }
      )
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('employee_invitations')
      .insert({
        company_id: companyId,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        invitation_token: invitationToken,
        expires_at: expiresAt
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Invitation creation error:', invitationError)
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Einladung' },
        { status: 500 }
      )
    }

    // Send invitation email
    const emailResult = await sendEmployeeInvitation(
      email, 
      firstName || '', 
      lastName || '', 
      company.name, 
      invitationToken,
      'Ihr Administrator' // You can get the actual inviter name if needed
    )
    
    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error)
      // Don't fail the invitation, but log the error
    }

    return NextResponse.json({
      message: 'Einladung erfolgreich gesendet',
      invitationId: invitation.id
    })

  } catch (error) {
    console.error('Employee invitation error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
} 