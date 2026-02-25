import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Initialize the response early
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Initialize Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on the request for the current server components
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // Re-initialize response to ensure headers are updated correctly
          response = NextResponse.next({
            request,
          })

          // Set cookies on the outgoing response so the browser saves them
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Refresh session (This is critical for Auth)
  // getUser() automatically refreshes the token if it is expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 4. DEFINE PROTECTED ROUTES
  const protectedRoutes = [
    '/dashboard', 
    '/profile', 
    '/post', 
    '/feed', 
    '/gig', 
    '/verify-id'
  ]

  const isProtected = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // 5. REDIRECT LOGIC
  // Not logged in -> Trying to access protected route
  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect_to', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Already logged in -> Trying to access login page
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     * - public images (svg, png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
