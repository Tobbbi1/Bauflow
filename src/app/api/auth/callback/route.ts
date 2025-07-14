import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'

  if (code) {
    const supabase = createClient()
    
    try {
      // Exchange code for session
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Session exchange error:', sessionError)
        return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
      }

      if (!sessionData.user) {
        return NextResponse.redirect(`${origin}/auth/login?error=no_user`)
      }

      console.log('User confirmed email:', sessionData.user.id)

      // Check if user already has a company (in case of re-confirmation)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', sessionData.user.id)
        .single()

      if (existingProfile?.company_id) {
        console.log('User already has company, redirecting to confirmation page')
        return NextResponse.redirect(`${origin}/auth/confirmed`)
      }

      // Get pending company data from user metadata
      const pendingCompany = sessionData.user.user_metadata?.pending_company
      const firstName = sessionData.user.user_metadata?.first_name
      const lastName = sessionData.user.user_metadata?.last_name

      if (!pendingCompany) {
        console.error('No pending company data found')
        return NextResponse.redirect(`${origin}/auth/login?error=no_company_data`)
      }

      // Use admin client to create company and profile
      const adminSupabase = createAdminClient()

      // Create company
      const { data: company, error: companyError } = await adminSupabase
        .from('companies')
        .insert({
          name: pendingCompany.name,
          address: pendingCompany.address,
          phone: pendingCompany.phone,
          email: pendingCompany.email,
          website: pendingCompany.website
        })
        .select()
        .single()

      if (companyError) {
        console.error('Company creation error:', companyError)
        return NextResponse.redirect(`${origin}/auth/login?error=company_creation_failed`)
      }

      console.log('Company created after email confirmation:', company.id)

      // Create profile
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .upsert({
          id: sessionData.user.id,
          company_id: company.id,
          first_name: firstName,
          last_name: lastName,
          email: sessionData.user.email,
          role: 'admin'
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Clean up company if profile creation fails
        await adminSupabase.from('companies').delete().eq('id', company.id)
        return NextResponse.redirect(`${origin}/auth/login?error=profile_creation_failed`)
      }

      console.log('Profile created after email confirmation for user:', sessionData.user.id)

      // Clear pending company data from user metadata
      await adminSupabase.auth.admin.updateUserById(sessionData.user.id, {
        user_metadata: {
          first_name: firstName,
          last_name: lastName
          // Remove pending_company
        }
      })

      // Success! Redirect to confirmation page
      return NextResponse.redirect(`${origin}/auth/confirmed`)

    } catch (error) {
      console.error('Callback processing error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
} 