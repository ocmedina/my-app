// src/components/Sidebar.tsx
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
  HiOutlineClipboardList,
} from "react-icons/hi";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: HiOutlineChartPie },
  {
    href: "/dashboard/ventas/nueva",
    label: "Nueva Venta",
    icon: HiOutlineTicket,
  },
  {
    href: "/dashboard/ventas",
    label: "Historial de Ventas",
    icon: HiOutlineDocumentText,
  },
  { href: "/dashboard/products", label: "Productos", icon: HiOutlineTag },
  {
    href: "/dashboard/inventario",
    label: "Inventario (Kardex)",
    icon: HiOutlineClipboardList,
  },
  { href: "/dashboard/clientes", label: "Clientes", icon: HiOutlineUsers },
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
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    email: string;
    role: string;
  } | null>(null);

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

  const visibleLinks = navLinks.filter(
    (link) => !link.adminOnly || userProfile?.role === "administrador"
  );

  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col justify-between shadow-lg">
      {/* Header */}
      <div>
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            FrontStock
          </h1>
        </div>

        {/* Navegación */}
        <nav className="p-2 mt-2 space-y-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/dashboard"
                ? pathname === link.href
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "hover:bg-slate-700 hover:text-white"
                  }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer con usuario */}
      <div className="p-4 border-t border-slate-700">
        <div className="mb-3">
          <p className="text-sm font-semibold text-white truncate">
            {userProfile?.full_name}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {userProfile?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-slate-700 text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <HiOutlineLogout className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
