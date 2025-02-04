import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()

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
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    // Use getUser for secure authentication
    const { data: { user }, error } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname

    // Define routes
    const publicRoutes = ['/auth', '/api', '/auth/callback', '/']
    const protectedRoutes = ['/future-story', '/fyp', '/profile']
    
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    // Handle authentication for protected routes
    if (!user && isProtectedRoute) {
      const redirectUrl = new URL('/auth', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users away from auth page
    if (user && pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/fyp', request.url))
    }

    return res
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.redirect(new URL('/auth', request.url))
  }
}

