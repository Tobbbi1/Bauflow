export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        projects (
          id,
          name,
          color,
          customers (
            id,
            name
          )
        ),
        customers (
          id,
          name,
          contact_person,
          contact_phone
        ),
        appointment_employees (
          employees (
            id,
            first_name,
            last_name,
            initials,
            color
          )
        ),
        appointment_materials (
          quantity,
          materials (
            id,
            name,
            unit,
            price_per_unit
          )
        )
      `)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 