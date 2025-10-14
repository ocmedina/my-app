'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createEmployee(formData: FormData) {
  const cookieStore = cookies()

  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  if (!fullName || !email || !password || !role) {
    return { success: false, message: 'Todos los campos son requeridos.' };
  }

  // Se crea un cliente de Supabase con permisos de administrador usando la clave secreta
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

  // Se usa la función de administrador para crear un usuario directamente
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Se confirma el email automáticamente para que el empleado no necesite hacerlo
    user_metadata: { 
      full_name: fullName,
      role: role 
    },
  });

  if (error) {
    if (error.message.includes('unique constraint')) {
        return { success: false, message: 'Ya existe un usuario con ese correo electrónico.' };
    }
    return { success: false, message: error.message };
  }

  // El trigger de la base de datos se encargará de crear el perfil
  return { success: true, message: `Empleado "${fullName}" creado exitosamente.` };
}