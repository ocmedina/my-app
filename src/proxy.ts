import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Prioriza metadata de Auth para evitar una query por request cuando el rol ya existe
  let role = session.user.user_metadata?.role as string | undefined

  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    role = profile?.role
  }

  if (role === 'repartidor' && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/reparto', req.url))
  }

  if (
    (role === 'administrador' || role === 'vendedor' || role === 'supervendedor') &&
    req.nextUrl.pathname.startsWith('/reparto')
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/reparto/:path*'],
}