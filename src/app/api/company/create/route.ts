import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { name, address, phone, email, website, first_name, last_name } = body

    console.log('Company create request:', { name, email, first_name, last_name })

    if (!name) {
      return NextResponse.json({ error: 'Firmenname ist erforderlich' }, { status: 400 })
    }

    // Get current user with retry logic
    let user = null
    let attempts = 0
    const maxAttempts = 3

    while (!user && attempts < maxAttempts) {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      
      if (currentUser) {
        user = currentUser
        break
      }
      
      if (authError) {
        console.error('Auth error attempt', attempts + 1, ':', authError)
      }
      
      attempts++
      if (attempts < maxAttempts) {
        // Wait 500ms before retry
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    if (!user) {
      console.error('No user found after', maxAttempts, 'attempts')
      return NextResponse.json({ error: 'Benutzer nicht authentifiziert. Bitte loggen Sie sich ein.' }, { status: 401 })
    }

    console.log('User found:', user.id, user.email)

    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name,
        address,
        phone,
        email,
        website
      })
      .select()
      .single()

    if (companyError) {
      console.error('Error creating company:', companyError)
      return NextResponse.json({ error: companyError.message }, { status: 500 })
    }

    console.log('Company created:', company.id)

    // Create or update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        company_id: company.id,
        first_name: first_name || null,
        last_name: last_name || null,
        email: user.email,
        role: 'admin'
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    console.log('Profile created/updated for user:', user.id)

    return NextResponse.json({ 
      success: true, 
      company: company,
      message: 'Firma erfolgreich erstellt' 
    })

  } catch (error) {
    console.error('Unexpected error in company creation:', error)
    return NextResponse.json({ 
      error: 'Ein unerwarteter Fehler ist aufgetreten' 
    }, { status: 500 })
  }
} 