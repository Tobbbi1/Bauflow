export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort sind erforderlich' }, { status: 400 })
    }

    // Sign in user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('Login error:', authError)
      
      if (authError.message === 'Invalid login credentials') {
        return NextResponse.json({ error: 'Invalid login credentials' }, { status: 401 })
      }
      if (authError.message === 'Email not confirmed') {
        return NextResponse.json({ error: 'Email not confirmed' }, { status: 401 })
      }
      
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Anmeldung fehlgeschlagen' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Anmeldung erfolgreich',
      user: authData.user 
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 