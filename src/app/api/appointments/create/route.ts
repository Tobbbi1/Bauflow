export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { 
      title, 
      project_id, 
      customer_id, 
      description, 
      location, 
      start_time, 
      end_time, 
      status,
      color,
      employee_ids = [],
      materials = []
    } = body

    if (!title || !start_time || !end_time) {
      return NextResponse.json({ error: 'Titel, Start- und Endzeit sind erforderlich' }, { status: 400 })
    }

    // Termin erstellen
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        title,
        project_id,
        customer_id,
        description,
        location,
        start_time,
        end_time,
        status: status || 'geplant',
        color
      })
      .select()
      .single()

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError)
      return NextResponse.json({ error: appointmentError.message }, { status: 500 })
    }

    // Mitarbeiter zuweisen
    if (employee_ids.length > 0) {
      const employeeAssignments = employee_ids.map((employee_id: string) => ({
        appointment_id: appointment.id,
        employee_id
      }))

      const { error: employeeError } = await supabase
        .from('appointment_employees')
        .insert(employeeAssignments)

      if (employeeError) {
        console.error('Error assigning employees:', employeeError)
      }
    }

    // Materialien zuweisen
    if (materials.length > 0) {
      const materialAssignments = materials.map((material: any) => ({
        appointment_id: appointment.id,
        material_id: material.material_id,
        quantity: material.quantity
      }))

      const { error: materialError } = await supabase
        .from('appointment_materials')
        .insert(materialAssignments)

      if (materialError) {
        console.error('Error assigning materials:', materialError)
      }
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 