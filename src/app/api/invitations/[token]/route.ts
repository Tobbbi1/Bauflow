export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient()
    const { token } = params

    // Get invitation with company details
    const { data: invitation, error } = await supabase
      .from('employee_invitations')
      .select(`
        *,
        companies (
          name,
          address
        )
      `)
      .eq('invitation_token', token)
      .eq('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: 'Einladung nicht gefunden oder abgelaufen' }, { status: 404 })
    }

    return NextResponse.json(invitation)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 