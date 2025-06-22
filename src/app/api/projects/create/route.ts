import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Use service role client that bypasses RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get the authenticated user from the request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Keine Authentifizierung' },
        { status: 401 }
      )
    }

    // Extract user from JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Ungültige Authentifizierung' },
        { status: 401 }
      )
    }

    // Get user profile
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
    
    // Create the project with service role (bypasses RLS)
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