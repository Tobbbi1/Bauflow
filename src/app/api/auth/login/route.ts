import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'E-Mail und Passwort sind erforderlich' }, { status: 400 })
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 401 })
  }

  // We don't need to fetch the profile here, the client can do that after login.
  // The session is now set in the cookies by the Supabase client.
  return NextResponse.json({ user: data.user })
} 