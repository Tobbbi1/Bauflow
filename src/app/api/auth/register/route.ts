import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('\n\n--- [REGISTER] NEW REQUEST ---')
  try {
    const supabase = await createClient()
    console.log('[REGISTER] 1. Supabase client created.')

    const body = await request.json()
    console.log('[REGISTER] 2. Request body parsed:', { ...body, password: '[HIDDEN]' })
    
    const {
      email,
      password,
      firstName,
      lastName,
      companyName,
      // We are not using these fields in the new logic, but they might come from the form
      companyAddress,
      companyPhone,
      companyEmail
    } = body

    // 1. Validate required fields
    if (!email || !password || !firstName || !lastName || !companyName) {
      console.error('[REGISTER] VALIDATION FAILED: Missing required fields.')
      return NextResponse.json(
        { error: 'Alle Pflichtfelder müssen ausgefüllt werden' },
        { status: 400 }
      )
    }
    console.log('[REGISTER] 3. Validation passed.')

    // 2. Create the company first
    console.log('[REGISTER] 4. Attempting to create company:', companyName)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ 
        name: companyName,
        address: companyAddress,
        phone: companyPhone,
        email: companyEmail
      })
      .select('id')
      .single()

    if (companyError) {
      console.error('[REGISTER] COMPANY CREATION ERROR:', companyError)
      return NextResponse.json(
        { error: `Fehler beim Erstellen der Firma: ${companyError.message}` },
        { status: 500 }
      )
    }
    console.log('[REGISTER] 5. Company created successfully. ID:', company.id)

    // 3. Sign up the user using Supabase Auth
    console.log('[REGISTER] 6. Attempting to sign up user with Supabase Auth:', email)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          company_id: company.id,
          role: 'admin',
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`,
      },
    })

    if (signUpError) {
      console.error('[REGISTER] SUPABASE SIGN UP ERROR:', signUpError)
      await supabase.from('companies').delete().eq('id', company.id)
      console.log('[REGISTER] Rollback: Deleted company', company.id)
      return NextResponse.json({ error: `Fehler bei der Benutzerregistrierung: ${signUpError.message}` }, { status: signUpError.status || 500 })
    }

    if (!data.user) {
      console.error('[REGISTER] CRITICAL: Sign up reported success but returned no user.')
      await supabase.from('companies').delete().eq('id', company.id)
      console.log('[REGISTER] Rollback: Deleted company', company.id)
      return NextResponse.json({ error: 'Benutzer konnte nicht erstellt werden, obwohl die Registrierung erfolgreich schien.' }, { status: 500 })
    }

    console.log('[REGISTER] 7. User sign up successful. User ID:', data.user.id)
    return NextResponse.json({
      message: 'Registrierung erfolgreich. Bitte prüfen Sie Ihr Postfach, um Ihre E-Mail-Adresse zu bestätigen.',
      user: data.user,
    })

  } catch (error) {
    console.error('[REGISTER] UNHANDLED CATCH BLOCK ERROR:', error)
    const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Serverfehler ist aufgetreten.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 