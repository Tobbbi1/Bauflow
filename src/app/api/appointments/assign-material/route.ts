export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { appointment_id, material_id, quantity } = body

    if (!appointment_id || !material_id || !quantity) {
      return NextResponse.json({ error: 'Termin-ID, Material-ID und Menge sind erforderlich' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('appointment_materials')
      .insert({
        appointment_id,
        material_id,
        quantity: parseFloat(quantity)
      })
      .select()
      .single()

    if (error) {
      console.error('Error assigning material:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const appointment_id = searchParams.get('appointment_id')
    const material_id = searchParams.get('material_id')

    if (!appointment_id || !material_id) {
      return NextResponse.json({ error: 'Termin-ID und Material-ID sind erforderlich' }, { status: 400 })
    }

    const { error } = await supabase
      .from('appointment_materials')
      .delete()
      .eq('appointment_id', appointment_id)
      .eq('material_id', material_id)

    if (error) {
      console.error('Error removing material assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 