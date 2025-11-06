"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
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
  HiOutlineCog,
  HiOutlineTruck, // <-- Ícono para Proveedores
  HiOutlineArchive, // <-- Ícono para Compras
} from "react-icons/hi";

// Organizamos los enlaces por categorías
const navSections = {
  ventas: [
    {
      href: "/dashboard/ventas/nueva",
      label: "Nueva Venta",
      icon: HiOutlineTicket,
    },
    {
      href: "/dashboard/ventas",
      label: "Historial",
      icon: HiOutlineDocumentText,
    },
  ],
  catalogos: [
    { href: "/dashboard/products", label: "Productos", icon: HiOutlineTag },
    { href: "/dashboard/clientes", label: "Clientes", icon: HiOutlineUsers },
    {
      href: "/dashboard/proveedores",
      label: "Proveedores",
      icon: HiOutlineTruck,
      adminOnly: true,
    }, // <-- AÑADIDO
  ],
  gestion: [
    {
      href: "/dashboard/pedidos",
      label: "Pedidos",
      icon: HiOutlineShoppingCart,
      adminOnly: true,
    },

    {
      href: "/dashboard/facturas",
      label: "Facturas",
      icon: HiOutlineDocumentText,
      adminOnly: true,
    },
  ],
  administracion: [
    {
      href: "/dashboard/reportes",
      label: "Cierre de Caja",
      icon: HiOutlineDocumentReport,
      adminOnly: true,
    },
    {
      href: "/dashboard/usuarios",
      label: "Usuarios",
      icon: HiOutlineUserGroup,
      adminOnly: true,
    },
  ],
  graficos: [
    {
      href: "/dashboard/graficos",
      label: "Gráficos",
      icon: HiOutlineChartPie,
      adminOnly: true,
    },
  ],
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    email: string;
    role: string;
  } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", session.user.id)
          .single();

        setUserProfile({
          full_name: profile?.full_name ?? "Usuario",
          email: session.user.email ?? "",
          role: profile?.role ?? "vendedor",
        });
      }
    };
    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Definición de roles
  const role = userProfile?.role;
  const isAdmin = role === "administrador";
  // @ts-ignore - 'supervendedor' no está en tu tipo de rol base, pero lo mantenemos por si lo usas
  const isSuper = role === "supervendedor";

  // Filtro de visibilidad según rol
  const getVisibleLinks = (section: any[]) =>
    section.filter((link) => {
      if (!link.adminOnly) return true;
      if (isAdmin) return true;
      // @ts-ignore
      if (
        isSuper &&
        ["pedidos", "facturas", "reportes"].some((word) =>
          link.href.includes(word)
        )
      )
        return true;
      return false;
    });

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    // Corregido: /dashboard/ventas no debe estar activo si estás en /dashboard/ventas/nueva
    if (
      href.endsWith("/ventas") &&
      (pathname.startsWith("/dashboard/ventas/nueva") ||
        pathname.startsWith("/dashboard/ventas/"))
    )
      return false;
    if (
      href.endsWith("/pedidos") &&
      (pathname.startsWith("/dashboard/pedidos/nuevo") ||
        pathname.startsWith("/dashboard/pedidos/edit"))
    )
      return false;
    if (
      href.endsWith("/compras") &&
      pathname.startsWith("/dashboard/compras/nueva")
    )
      return false;

    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-2 sm:px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo y Dashboard */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all whitespace-nowrap"
            >
              FrontStock
            </Link>
            <Link
              href="/dashboard"
              className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${
                  pathname === "/dashboard"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <HiOutlineChartPie className="h-4 w-4" />
              Dashboard
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center max-w-6xl mx-2">
            <div className="flex items-center gap-0.5 flex-wrap justify-center">
              {/* VENTAS */}
              <div className="flex items-center gap-0.5 px-1 py-1 rounded-lg bg-blue-50 mb-1">
                {getVisibleLinks(navSections.ventas).map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                      ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden xl:inline">{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="w-px h-5 bg-gray-300 mx-0.5" />

              {/* CATÁLOGOS (AQUÍ AÑADIMOS PROVEEDORES) */}
              <div className="flex items-center gap-0.5 px-1 py-1 rounded-lg bg-green-50 mb-1">
                {getVisibleLinks(navSections.catalogos).map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                      ${
                        isActive
                          ? "bg-green-600 text-white shadow-sm"
                          : "text-green-700 hover:bg-green-100"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden xl:inline">{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* GESTIÓN (AQUÍ AÑADIMOS COMPRAS) */}
              {getVisibleLinks(navSections.gestion).length > 0 && (
                <>
                  <div className="w-px h-5 bg-gray-300 mx-0.5" />
                  <div className="flex items-center gap-0.5 px-1 py-1 rounded-lg bg-purple-50 mb-1">
                    {getVisibleLinks(navSections.gestion).map((link) => {
                      const Icon = link.icon;
                      const isActive = isLinkActive(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                          ${
                            isActive
                              ? "bg-purple-600 text-white shadow-sm"
                              : "text-purple-700 hover:bg-purple-100"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ADMINISTRACIÓN */}
              {getVisibleLinks(navSections.administracion).length > 0 && (
                <>
                  <div className="w-px h-5 bg-gray-300 mx-0.5" />
                  <div className="flex items-center gap-0.5 px-1 py-1 rounded-lg bg-orange-50 mb-1">
                    {getVisibleLinks(navSections.administracion).map((link) => {
                      const Icon = link.icon;
                      const isActive = isLinkActive(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                          ${
                            isActive
                              ? "bg-orange-600 text-white shadow-sm"
                              : "text-orange-700 hover:bg-orange-100"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}

              {/* GRÁFICOS */}
              {isAdmin && getVisibleLinks(navSections.graficos).length > 0 && (
                <>
                  <div className="w-px h-5 bg-gray-300 mx-0.5" />
                  <div className="flex items-center gap-0.5 px-1 py-1 rounded-lg bg-sky-50 mb-1">
                    {getVisibleLinks(navSections.graficos).map((link) => {
                      const Icon = link.icon;
                      const isActive = isLinkActive(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                          ${
                            isActive
                              ? "bg-sky-600 text-white shadow-sm"
                              : "text-sky-700 hover:bg-sky-100"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden lg:block relative flex-shrink-0">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {userProfile?.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="text-left hidden xl:block">
                <p className="text-xs font-semibold text-gray-800 leading-tight">
                  {userProfile?.full_name}
                </p>
                <p className="text-[10px] text-gray-500">
                  {/* @ts-ignore */}
                  {isAdmin
                    ? "Administrador"
                    : isSuper
                    ? "Supervendedor"
                    : "Vendedor"}
                </p>
              </div>
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">
                      {userProfile?.full_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {userProfile?.email}
                    </p>
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      {/* @ts-ignore */}
                      {isAdmin
                        ? "Administrador"
                        : isSuper
                        ? "Supervendedor"
                        : "Vendedor"}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/configuracion"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <HiOutlineCog className="h-4 w-4" />
                    Configuración
                  </Link>
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

          {/* Botón menú móvil */}
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

        {/* Menú móvil desplegable */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white pb-4">
            <div className="px-2 py-3 space-y-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* Dashboard en móvil */}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    pathname === "/dashboard"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <HiOutlineChartPie className="h-5 w-5" />
                Dashboard
              </Link>

              {/* Sección Ventas */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-600 uppercase px-3 mb-1">
                  Ventas
                </p>
                {getVisibleLinks(navSections.ventas).map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-blue-50"
                        }`}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Sección Catálogos (AQUÍ AÑADIMOS PROVEEDORES) */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-green-600 uppercase px-3 mb-1">
                  Catálogos
                </p>
                {getVisibleLinks(navSections.catalogos).map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                          isActive
                            ? "bg-green-600 text-white"
                            : "text-gray-700 hover:bg-green-50"
                        }`}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Sección Gestión (PEDIDOS Y FACTURAS) */}
              {getVisibleLinks(navSections.gestion).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-purple-600 uppercase px-3 mb-1">
                    Gestión
                  </p>
                  {getVisibleLinks(navSections.gestion).map((link) => {
                    const Icon = link.icon;
                    const isActive = isLinkActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${
                            isActive
                              ? "bg-purple-600 text-white"
                              : "text-gray-700 hover:bg-purple-50"
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Sección Administración */}
              {getVisibleLinks(navSections.administracion).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-orange-600 uppercase px-3 mb-1">
                    Administración
                  </p>
                  {getVisibleLinks(navSections.administracion).map((link) => {
                    const Icon = link.icon;
                    const isActive = isLinkActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${
                            isActive
                              ? "bg-orange-600 text-white"
                              : "text-gray-700 hover:bg-orange-50"
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Sección Gráficos */}
              {isAdmin && getVisibleLinks(navSections.graficos).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-sky-600 uppercase px-3 mb-1">
                    Gráficos
                  </p>
                  {getVisibleLinks(navSections.graficos).map((link) => {
                    const Icon = link.icon;
                    const isActive = isLinkActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${
                            isActive
                              ? "bg-sky-600 text-white"
                              : "text-gray-700 hover:bg-sky-50"
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Usuario y Configuración */}
              <div className="pt-3 border-t border-gray-200 space-y-1">
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-800">
                    {userProfile?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {userProfile?.email}
                  </p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    {/* @ts-ignore */}
                    {isAdmin
                      ? "Administrador"
                      : isSuper
                      ? "Supervendedor"
                      : "Vendedor"}
                  </p>
                </div>

                <Link
                  href="/dashboard/configuracion"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <HiOutlineCog className="h-5 w-5" />
                  Configuración
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <HiOutlineLogout className="h-5 w-5" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
