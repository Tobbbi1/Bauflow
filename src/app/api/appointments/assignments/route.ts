export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const appointment_id = searchParams.get('appointment_id')

    if (!appointment_id) {
      return NextResponse.json({ error: 'Termin-ID ist erforderlich' }, { status: 400 })
    }

    // Mitarbeiter-Zuweisungen abrufen
    const { data: employees, error: employeeError } = await supabase
      .from('appointment_employees')
      .select(`
        employees (
          id,
          first_name,
          last_name,
          initials,
          color
        )
      `)
      .eq('appointment_id', appointment_id)

    if (employeeError) {
      console.error('Error fetching employee assignments:', employeeError)
      return NextResponse.json({ error: employeeError.message }, { status: 500 })
    }

    // Material-Zuweisungen abrufen
    const { data: materials, error: materialError } = await supabase
      .from('appointment_materials')
      .select(`
        quantity,
        materials (
          id,
          name,
          unit,
          price_per_unit
        )
      `)
      .eq('appointment_id', appointment_id)

    if (materialError) {
      console.error('Error fetching material assignments:', materialError)
      return NextResponse.json({ error: materialError.message }, { status: 500 })
    }

    return NextResponse.json({
      employees: employees.map(e => e.employees),
      materials: materials.map(m => ({
        ...m.materials,
        quantity: m.quantity
      }))
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 