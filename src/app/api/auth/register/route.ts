import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      company_name, 
      company_address, 
      company_phone, 
      company_email, 
      company_website 
    } = body

    console.log('Registration request:', { email, first_name, last_name, company_name })

    if (!email || !password || !first_name || !last_name || !company_name) {
      return NextResponse.json({ 
        error: 'Alle Pflichtfelder müssen ausgefüllt werden' 
      }, { status: 400 })
    }

    // Use regular client for normal signup with email confirmation
    const supabase = createClient()

    // Check if user already exists
    const adminSupabase = createAdminClient()
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
    const userExists = existingUsers?.users?.find(user => user.email === email)
    
    if (userExists) {
      return NextResponse.json({ 
        error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits' 
      }, { status: 400 })
    }

    // 1. Sign up user with email confirmation required
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          // Store company data in user metadata temporarily
          pending_company: {
            name: company_name,
            address: company_address,
            phone: company_phone,
            email: company_email,
            website: company_website
          }
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
      }
    })

    if (authError) {
      console.error('Signup error:', authError)
      return NextResponse.json({ 
        error: `Registrierung fehlgeschlagen: ${authError.message}` 
      }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ 
        error: 'Benutzer konnte nicht erstellt werden' 
      }, { status: 500 })
    }

    console.log('User signed up (email confirmation pending):', authData.user.id)

    return NextResponse.json({ 
      success: true,
      message: 'Registrierung erfolgreich! Bitte prüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Bestätigungslink.',
      requiresEmailConfirmation: true,
      user: {
        id: authData.user.id,
        email: authData.user.email
      }
    })

  } catch (error) {
    console.error('Unexpected registration error:', error)
    return NextResponse.json({ 
      error: 'Ein unerwarteter Fehler ist aufgetreten' 
    }, { status: 500 })
  }
} 