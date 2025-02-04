import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()

  // Define routes first
  const pathname = request.nextUrl.pathname
  const publicRoutes = ['/auth', '/api', '/auth/callback', '/']
  const protectedRoutes = ['/future-story', '/fyp', '/profile']
  
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Skip middleware for public routes
  if (isPublicRoute && !isProtectedRoute) {
    return res
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.delete(name)
          },
        },
      }
    )

    // Check auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    // If there's a session error, but it's not a protected route, continue
    if (sessionError && !isProtectedRoute) {
      return res
    }

    // Handle protected routes
    if (!session && isProtectedRoute) {
      const redirectUrl = new URL('/auth', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Handle auth page access when logged in
    if (session && pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/fyp', request.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    
    // If it's not a protected route, continue instead of redirecting
    if (!isProtectedRoute) {
      return res
    }
    
    // For protected routes, redirect to auth
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }
}

// Configure which paths the middleware will run on
export const config = {
  matcher: [
    '/future-story/:path*',
    '/fyp/:path*',
    '/profile/:path*',
    '/auth/:path*'
  ]
}

