import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    console.log('User authenticated:', user.id)

    // Get user profile to verify company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return NextResponse.json(
        { error: 'Benutzerprofil nicht gefunden' },
        { status: 404 }
      )
    }

    console.log('Profile loaded:', { company_id: profile.company_id, role: profile.role })

    const body = await request.json()
    
    const projectData = {
      ...body,
      created_by: user.id,
      company_id: profile.company_id
    }

    console.log('Attempting to insert project with data:', projectData)
    
    // Create the project with server-side context (RLS still applies but works correctly)
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) {
      console.error('Project creation error:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { error: `Fehler beim Erstellen der Baustelle: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Project created successfully:', data)

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