export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient()
    const { token } = params
    const { user_id } = await request.json()

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('employee_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Einladung nicht gefunden oder abgelaufen' }, { status: 404 })
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user_id,
        company_id: invitation.company_id,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        email: invitation.email,
        role: invitation.role
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Create employee record
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert({
        company_id: invitation.company_id,
        user_id: user_id,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        email: invitation.email,
        role: invitation.role === 'admin' ? 'geschäftsführer' : 'mitarbeiter'
      })
      .select()
      .single()

    if (employeeError) {
      console.error('Error creating employee:', employeeError)
      return NextResponse.json({ error: employeeError.message }, { status: 500 })
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('employee_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
    }

    return NextResponse.json({ message: 'Einladung erfolgreich angenommen', employee })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 