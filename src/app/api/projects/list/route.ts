export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()

    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        customers (
          id,
          name,
          contact_person,
          contact_phone,
          contact_email
        )
      `)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 