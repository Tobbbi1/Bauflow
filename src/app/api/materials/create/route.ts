import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { name, description, unit, price_per_unit } = body

    if (!name) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }

    const { data: material, error } = await supabase
      .from('materials')
      .insert({
        name,
        description,
        unit,
        price_per_unit: price_per_unit ? parseFloat(price_per_unit) : null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating material:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 