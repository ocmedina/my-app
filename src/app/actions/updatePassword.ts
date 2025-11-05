'use server'

import { createAdminClient } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'

export async function updateUserPassword(userId: string, newPassword: string) {
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword
  })

  if (error) {
    console.error('Error actualizando contraseña:', error)
    return { success: false, message: 'Error al cambiar la contraseña' }
  }

  revalidatePath('/dashboard/usuarios')
  return { success: true, message: 'Contraseña actualizada correctamente' }
}
