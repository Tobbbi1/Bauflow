import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Auth required paths
  const authRequiredPaths = ['/app']
  const isAuthRequiredPath = authRequiredPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // Public auth paths
  const publicAuthPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']
  const isPublicAuthPath = publicAuthPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // Invitation paths (always accessible)
  const isInvitePath = req.nextUrl.pathname.startsWith('/auth/invite/')

  // If no session and trying to access protected route
  if (!session && isAuthRequiredPath) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // If session exists and trying to access public auth pages (except invites)
  if (session && isPublicAuthPath && !isInvitePath) {
    return NextResponse.redirect(new URL('/app', req.url))
  }

  // Check if user has company setup (for authenticated users on app routes)
  if (session && isAuthRequiredPath) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', session.user.id)
        .single()

      // If no company, redirect to registration (shouldn't happen in normal flow)
      if (!profile?.company_id) {
        return NextResponse.redirect(new URL('/auth/register', req.url))
      }

      // For employee role users, check if they're trying to access admin features
      if (profile.role === 'employee') {
        const adminPaths = [
          '/app/settings',
          '/app/projects/create'
        ]
        
        const isAdminPath = adminPaths.some(path => 
          req.nextUrl.pathname.startsWith(path)
        )

        if (isAdminPath) {
          return NextResponse.redirect(new URL('/app', req.url))
        }
      }

    } catch (error) {
      console.error('Middleware error:', error)
      // Continue with request if profile check fails
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 