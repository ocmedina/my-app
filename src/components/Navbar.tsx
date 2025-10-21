// src/components/Navbar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  HiOutlineChartPie, 
  HiOutlineDocumentText, 
  HiOutlineShoppingCart, 
  HiOutlineTag, 
  HiOutlineTicket, 
  HiOutlineUsers,
  HiOutlineLogout,
  HiOutlineDocumentReport,
  HiOutlineUserGroup,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineCog
} from 'react-icons/hi'

// Organizamos los enlaces por categorías
const navSections = {
  ventas: [
    { href: '/dashboard/ventas/nueva', label: 'Nueva Venta', icon: HiOutlineTicket },
    { href: '/dashboard/ventas', label: 'Historial', icon: HiOutlineDocumentText },
  ],
  catalogos: [
    { href: '/dashboard/products', label: 'Productos', icon: HiOutlineTag },
    { href: '/dashboard/clientes', label: 'Clientes', icon: HiOutlineUsers },
  ],
  gestion: [
    { href: '/dashboard/pedidos', label: 'Pedidos', icon: HiOutlineShoppingCart, adminOnly: true },
    { href: '/dashboard/facturas', label: 'Facturas', icon: HiOutlineDocumentText, adminOnly: true },
  ],
  administracion: [
    { href: '/dashboard/reportes', label: 'Cierre de Caja', icon: HiOutlineDocumentReport, adminOnly: true },
    { href: '/dashboard/usuarios', label: 'Usuarios', icon: HiOutlineUserGroup, adminOnly: true },
  ]
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<{ full_name: string, email: string, role: string } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single()
        
        setUserProfile({
          full_name: profile?.full_name ?? 'Usuario',
          email: session.user.email ?? '',
          role: profile?.role ?? 'vendedor'
        })
      }
    }
    fetchUserProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = userProfile?.role === 'administrador'

  // Filtrar enlaces visibles según el rol
  const getVisibleLinks = (section: any[]) => {
    return section.filter(link => !link.adminOnly || isAdmin)
  }

  const isLinkActive = (href: string) => {
    // Para el dashboard, solo debe ser activo en la ruta exacta
    if (href === '/dashboard') return pathname === href
    
    // Para rutas hijas, verificar que sea exacta o que sea padre directo
    // Si estamos en /dashboard/ventas/nueva, no debe activar /dashboard/ventas
    if (href === '/dashboard/ventas' && pathname.startsWith('/dashboard/ventas/')) {
      return false
    }
    
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo y Dashboard */}
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard" 
              className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all whitespace-nowrap"
            >
              FrontStock
            </Link>
            
            <Link
              href="/dashboard"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${pathname === '/dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <HiOutlineChartPie className="h-4 w-4" />
              Dashboard
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center max-w-4xl mx-4">
            {/* VENTAS */}
            <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-blue-50">
              {getVisibleLinks(navSections.ventas).map((link) => {
                const Icon = link.icon
                const isActive = isLinkActive(link.href)
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-blue-700 hover:bg-blue-100'
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* CATÁLOGOS */}
            <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-green-50">
              {getVisibleLinks(navSections.catalogos).map((link) => {
                const Icon = link.icon
                const isActive = isLinkActive(link.href)
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                      ${isActive
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-green-700 hover:bg-green-100'
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* GESTIÓN (solo admin) */}
            {isAdmin && getVisibleLinks(navSections.gestion).length > 0 && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-purple-50">
                  {getVisibleLinks(navSections.gestion).map((link) => {
                    const Icon = link.icon
                    const isActive = isLinkActive(link.href)
                    
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                          ${isActive
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-purple-700 hover:bg-purple-100'
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {link.label}
                      </Link>
                    )
                  })}
                </div>
              </>
            )}

            {/* ADMINISTRACIÓN (solo admin) */}
            {isAdmin && getVisibleLinks(navSections.administracion).length > 0 && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-orange-50">
                  {getVisibleLinks(navSections.administracion).map((link) => {
                    const Icon = link.icon
                    const isActive = isLinkActive(link.href)
                    
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                          ${isActive
                            ? 'bg-orange-600 text-white shadow-sm'
                            : 'text-orange-700 hover:bg-orange-100'
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {link.label}
                      </Link>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden lg:block relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-800 leading-tight">{userProfile?.full_name}</p>
                <p className="text-[10px] text-gray-500">{isAdmin ? 'Admin' : 'Vendedor'}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">{userProfile?.full_name}</p>
                    <p className="text-xs text-gray-500 mt-1">{userProfile?.email}</p>
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      {isAdmin ? 'Administrador' : 'Vendedor'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <HiOutlineLogout className="h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <HiOutlineX className="h-6 w-6" />
            ) : (
              <HiOutlineMenu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                ${pathname === '/dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <HiOutlineChartPie className="h-5 w-5" />
              Dashboard
            </Link>

            {/* Ventas */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 px-3">VENTAS</p>
              {getVisibleLinks(navSections.ventas).map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                      ${isLinkActive(link.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Catálogos */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 px-3">CATÁLOGOS</p>
              {getVisibleLinks(navSections.catalogos).map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                      ${isLinkActive(link.href)
                        ? 'bg-green-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Gestión (admin) */}
            {isAdmin && getVisibleLinks(navSections.gestion).length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 px-3">GESTIÓN</p>
                {getVisibleLinks(navSections.gestion).map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                        ${isLinkActive(link.href)
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Administración (admin) */}
            {isAdmin && getVisibleLinks(navSections.administracion).length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 px-3">ADMINISTRACIÓN</p>
                {getVisibleLinks(navSections.administracion).map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                        ${isLinkActive(link.href)
                          ? 'bg-orange-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Mobile User Info */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{userProfile?.full_name}</p>
                <p className="text-xs text-gray-500">{userProfile?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-red-100 hover:text-red-600 transition-colors border border-gray-200"
            >
              <HiOutlineLogout className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}