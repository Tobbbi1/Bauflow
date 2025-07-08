import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { id, name, description, unit, price_per_unit } = body

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 })
    }

    const { data: material, error } = await supabase
      .from('materials')
      .update({
        name,
        description,
        unit,
        price_per_unit: price_per_unit ? parseFloat(price_per_unit) : null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating material:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 