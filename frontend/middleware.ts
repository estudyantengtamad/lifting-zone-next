import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Only run auth checks on /admin and /account routes
  const isAdminRoute = pathname.startsWith('/admin')
  const isAccountRoute = pathname.startsWith('/account')

  if (!isAdminRoute && !isAccountRoute) {
    return NextResponse.next()
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, deny access gracefully
  if (!url || !key || url.includes('placeholder')) {
    if (isAdminRoute) {
      return new NextResponse(null, { status: 404 })
    }
    return NextResponse.redirect(new URL('/?auth_unavailable=1', request.url))
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  })

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        })
        response.cookies.set({ name, value: '', ...options })
      }
    }
  })

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Account route: require authenticated user
  if (isAccountRoute) {
    if (!user) {
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('auth', 'login')
      redirectUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  // 2. Admin route: require user with admin role; return 404 to non-admins
  if (isAdminRoute) {
    if (!user || !user.email) {
      return new NextResponse(null, { status: 404 })
    }

    // Check profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    let isAdmin = profile?.role === 'admin'

    // Check admin_emails table if profile is not admin
    if (!isAdmin) {
      const { data: adminEmail } = await supabase
        .from('admin_emails')
        .select('email')
        .ilike('email', user.email)
        .maybeSingle()

      if (adminEmail) {
        isAdmin = true
      }
    }

    if (!isAdmin) {
      // Must return 404 to non-admins as required
      return new NextResponse(null, { status: 404 })
    }

    return response
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*']
}
