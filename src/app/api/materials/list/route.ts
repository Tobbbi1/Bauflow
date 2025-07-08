import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()

    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching materials:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(materials)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 