// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  // Si no hay sesión y se intenta acceder a una ruta protegida, redirigir a login
  if (!session && (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/reparto'))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Si hay sesión, verificamos el rol
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Si es repartidor e intenta entrar al dashboard, lo mandamos a /reparto
    if (profile?.role === 'repartidor' && req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/reparto', req.url))
    }

    // Si es admin/vendedor e intenta entrar a /reparto, lo mandamos al dashboard
    if ((profile?.role === 'administrador' || profile?.role === 'vendedor') && req.nextUrl.pathname.startsWith('/reparto')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/reparto/:path*'],
}