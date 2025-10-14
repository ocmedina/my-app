'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createEmployee(formData: FormData) {
  // Se await cookies() porque ahora devuelve una promesa
  const cookieStore = await cookies()

  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  if (!fullName || !email || !password || !role) {
    return { success: false, message: 'Todos los campos son requeridos.' }
  }

  // Cliente de Supabase con permisos de administrador usando la clave de servicio
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // Crear usuario directamente con permisos de admin
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // confirma el email automáticamente
    user_metadata: {
      full_name: fullName,
      role,
    },
  })

  if (error) {
    if (error.message.includes('unique constraint')) {
      return { success: false, message: 'Ya existe un usuario con ese correo electrónico.' }
    }
    return { success: false, message: error.message }
  }

  // El trigger de la DB se encargará de crear el perfil
  return { success: true, message: `Empleado "${fullName}" creado exitosamente.` }
}
