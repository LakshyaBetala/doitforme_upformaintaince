import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Get User Session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  
  // --- PROTECTION RULES ---

  // 2. Protect Dashboard & Private Routes
  // If user is NOT logged in and tries to access dashboard, gigs, or post
  const protectedPaths = ["/dashboard", "/post", "/gig/create", "/verify"];
  const isProtected = protectedPaths.some((path) => url.pathname.startsWith(path));

  if (isProtected && !user) {
    url.pathname = "/login";
    // Redirect them to login, but remember where they wanted to go
    url.searchParams.set("next", request.nextUrl.pathname); 
    return NextResponse.redirect(url);
  }

  // 3. Prevent Logged-in Users from accessing Auth pages (Login/Register)
  const authPaths = ["/login", "/register"];
  const isAuthPage = authPaths.some((path) => url.pathname.startsWith(path));

  if (isAuthPage && user) {
    url.pathname = "/dashboard"; // Kick them to dashboard if already logged in
    return NextResponse.redirect(url);
  }

  // 4. Update Session (Important for Server Components)
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes - handled separately or by RLS)
     * - public (public assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};