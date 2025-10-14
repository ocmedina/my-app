// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Si el usuario no está autenticado y está intentando acceder a una ruta protegida
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    // Redirige a la página de login
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// Asegura que el middleware se ejecute solo en las rutas que nos interesan
export const config = {
  matcher: ['/dashboard/:path*'],
}