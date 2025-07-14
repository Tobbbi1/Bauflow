export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { entry_id, approved } = await request.json()

    if (!entry_id || typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Eintrag-ID und Genehmigungsstatus sind erforderlich' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Get current user's employee record (for approved_by)
    const { data: currentEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // Update approval status
    const updateData: any = {
      approved,
      approved_at: approved ? new Date().toISOString() : null
    }

    if (approved && currentEmployee) {
      updateData.approved_by = currentEmployee.id
    } else if (!approved) {
      updateData.approved_by = null
    }

    const { data, error } = await supabase
      .from('time_entries')
      .update(updateData)
      .eq('id', entry_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating approval:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: approved ? 'Stundenzettel genehmigt' : 'Genehmigung zurückgezogen',
      data 
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 