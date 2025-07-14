export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { appointment_id, employee_id } = body

    if (!appointment_id || !employee_id) {
      return NextResponse.json({ error: 'Termin-ID und Mitarbeiter-ID sind erforderlich' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('appointment_employees')
      .insert({
        appointment_id,
        employee_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error assigning employee:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const appointment_id = searchParams.get('appointment_id')
    const employee_id = searchParams.get('employee_id')

    if (!appointment_id || !employee_id) {
      return NextResponse.json({ error: 'Termin-ID und Mitarbeiter-ID sind erforderlich' }, { status: 400 })
    }

    const { error } = await supabase
      .from('appointment_employees')
      .delete()
      .eq('appointment_id', appointment_id)
      .eq('employee_id', employee_id)

    if (error) {
      console.error('Error removing employee assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 