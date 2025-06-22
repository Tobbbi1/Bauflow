import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Get user profile to verify company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Benutzerprofil nicht gefunden' },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    // Create the project with server-side context (RLS still applies but works correctly)
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...body,
        created_by: user.id,
        company_id: profile.company_id
      })
      .select()
      .single()

    if (error) {
      console.error('Project creation error:', error)
      return NextResponse.json(
        { error: `Fehler beim Erstellen der Baustelle: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Baustelle erfolgreich erstellt',
      data: data
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
} 