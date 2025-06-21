import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // If email is not confirmed, Supabase returns data but with a null session.
  // The error object is also null in this case. We need to check for this explicitly.
  if (data.user && data.user.aud !== 'authenticated') {
      // Optionally, re-send the confirmation email
      await supabase.auth.resend({ type: 'signup', email: email });
      return NextResponse.json({ error: 'Email not confirmed' }, { status: 401 });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 401 })
  }

  return NextResponse.json({ message: 'Login successful' }, { status: 200 })
} 