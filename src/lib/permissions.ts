export const ROLES = {
  ADMIN: 'administrador',
  VENDEDOR: 'vendedor',
  REPARTIDOR: 'repartidor',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const PERMISSIONS = {
  // Gestión de Usuarios
  VER_USUARIOS: [ROLES.ADMIN],
  CREAR_USUARIOS: [ROLES.ADMIN],
  EDITAR_USUARIOS: [ROLES.ADMIN],
  CAMBIAR_ROLES: [ROLES.ADMIN],
  
  // Productos
  CREAR_PRODUCTOS: [ROLES.ADMIN],
  EDITAR_PRODUCTOS: [ROLES.ADMIN],
  ELIMINAR_PRODUCTOS: [ROLES.ADMIN],
  VER_PRODUCTOS: [ROLES.ADMIN, ROLES.VENDEDOR],
  
  // Clientes
  CREAR_CLIENTES: [ROLES.ADMIN, ROLES.VENDEDOR],
  EDITAR_CLIENTES: [ROLES.ADMIN, ROLES.VENDEDOR],
  ELIMINAR_CLIENTES: [ROLES.ADMIN],
  VER_CLIENTES: [ROLES.ADMIN, ROLES.VENDEDOR],
  
  // Pedidos
  CREAR_PEDIDOS: [ROLES.ADMIN, ROLES.VENDEDOR],
  EDITAR_PEDIDOS: [ROLES.ADMIN, ROLES.VENDEDOR],
  CANCELAR_PEDIDOS: [ROLES.ADMIN],
  VER_PEDIDOS: [ROLES.ADMIN, ROLES.VENDEDOR, ROLES.REPARTIDOR],
  
  // Ventas
  CREAR_VENTAS: [ROLES.ADMIN, ROLES.VENDEDOR],
  VER_REPORTES: [ROLES.ADMIN],
  VER_VENTAS: [ROLES.ADMIN, ROLES.VENDEDOR],
  
  // Dashboard
  VER_DASHBOARD_COMPLETO: [ROLES.ADMIN],
  VER_DASHBOARD_LIMITADO: [ROLES.VENDEDOR, ROLES.REPARTIDOR],
} as const;

export function hasPermission(
  userRole: Role | null | undefined,
  permission: keyof typeof PERMISSIONS
): boolean {
  if (!userRole) return false;
  return PERMISSIONS[permission].includes(userRole as any);
}

export function isAdmin(userRole: Role | null | undefined): boolean {
  return userRole === ROLES.ADMIN;
}