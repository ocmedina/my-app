'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createEmployee(formData: FormData) {
  const cookieStore = await cookies()

  const fullName = formData.get('fullName') as string
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  if (!fullName || !username || !email || !password || !role) {
    return { success: false, message: 'Todos los campos son requeridos.' }
  }

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

  // Verificar que el username no exista
  const { data: existingUsername } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single()

  if (existingUsername) {
    return { success: false, message: 'El nombre de usuario ya existe.' }
  }

  // Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      username: username,
      role,
    },
  })

  if (authError) {
    if (authError.message.includes('unique constraint')) {
      return { success: false, message: 'Ya existe un usuario con ese correo electrónico.' }
    }
    return { success: false, message: authError.message }
  }

  // Actualizar el perfil con username y email
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ 
      username: username,
      email: email
    })
    .eq('id', authData.user.id)

  if (updateError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return { success: false, message: 'Error al configurar el perfil del usuario.' }
  }

  return { success: true, message: `Empleado "${fullName}" (${username}) creado exitosamente.` }
}