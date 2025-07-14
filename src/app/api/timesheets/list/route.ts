export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const employee_id = searchParams.get('employee_id')
    const project_id = searchParams.get('project_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    let query = supabase
      .from('time_entries')
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
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })

    if (employee_id) {
      query = query.eq('employee_id', employee_id)
    }

    if (project_id) {
      query = query.eq('project_id', project_id)
    }

    if (start_date) {
      query = query.gte('date', start_date)
    }

    if (end_date) {
      query = query.lte('date', end_date)
    }

    const { data: timeEntries, error } = await query

    if (error) {
      console.error('Error fetching time entries:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(timeEntries)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 