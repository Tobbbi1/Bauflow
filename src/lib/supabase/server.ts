import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Note: This is a server-side only client.
export async function createClient() {
  const cookieStore = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // This log will now appear in your server console when the /api/auth/register route is called
  console.log('--- SERVER-SIDE SUPABASE CLIENT ---')
  console.log('Attempting to create client with URL:', supabaseUrl ? 'URL loaded' : 'URL MISSING')
  console.log('Service Role Key loaded:', supabaseServiceRoleKey ? 'Key loaded' : 'KEY MISSING')
  console.log('-----------------------------------')


  if (!supabaseUrl || !supabaseServiceRoleKey) {
    // This will stop execution and show a clear error in the logs
    // if the variables are not loaded.
    throw new Error('Supabase URL or Service Role Key is missing from environment variables on the server.')
  }

  return createServerClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}