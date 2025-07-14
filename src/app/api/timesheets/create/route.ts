export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { 
      employee_id, 
      project_id, 
      appointment_id,
      date, 
      start_time, 
      end_time, 
      break_minutes,
      description,
      hourly_rate 
    } = body

    if (!employee_id || !date || !start_time || !end_time) {
      return NextResponse.json({ 
        error: 'Mitarbeiter, Datum, Start- und Endzeit sind erforderlich' 
      }, { status: 400 })
    }

    const { data: timeEntry, error } = await supabase
      .from('time_entries')
      .insert({
        employee_id,
        project_id,
        appointment_id,
        date,
        start_time,
        end_time,
        break_minutes: break_minutes || 0,
        description,
        hourly_rate
      })
      .select(`
        *,
        employees (
          id,
          first_name,
          last_name,
          initials,
          color
        ),
        projects (
          id,
          name,
          color
        )
      `)
      .single()

    if (error) {
      console.error('Error creating time entry:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(timeEntry)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 