import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { first_name, last_name, initials, color, role } = body

    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'Vorname und Nachname sind erforderlich' }, { status: 400 })
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .insert({
        first_name,
        last_name,
        initials,
        color: color || '#3B82F6',
        role: role || 'mitarbeiter'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating employee:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 