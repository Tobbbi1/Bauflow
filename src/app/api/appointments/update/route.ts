import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { 
      id,
      title, 
      project_id, 
      customer_id, 
      description, 
      location, 
      start_time, 
      end_time, 
      status,
      color
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 })
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({
        title,
        project_id,
        customer_id,
        description,
        location,
        start_time,
        end_time,
        status,
        color
      })
      .eq('id', id)
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
      .single()

    if (error) {
      console.error('Error updating appointment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 