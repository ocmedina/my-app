// src/components/CustomerActions.tsx
'use client'

import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function CustomerActions({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        if (profile) {
          setUserRole(profile.role)
        }
      }
    }
    fetchUserRole()
  }, [])

  // 👇 --- ESTA ES LA FUNCIÓN QUE CAMBIAMOS --- 👇
  const handleDelete = async () => {
    // 1. Mensaje de confirmación actualizado
    if (!confirm('¿Estás seguro de que quieres DESACTIVAR este cliente? Ya no aparecerá en las listas.')) {
      return
    }

    // 2. En lugar de .delete(), usamos .update()
    const { error } = await supabase
      .from('customers')
      .update({ is_active: false }) // <-- La lógica del borrado suave
      .match({ id: customerId })

    // 3. Mensajes de alerta actualizados
    if (error) {
      alert(`Error al desactivar el cliente: ${error.message}`)
    } else {
      alert('Cliente desactivado exitosamente.')
      router.refresh()
    }
  }

  // No mostramos nada hasta saber el rol
  if (userRole === null) {
    return null
  }

  return (
    <>
      {/* Mostramos los botones SOLO si el rol es 'administrador' */}
      {userRole === 'administrador' && (
        <>
          <Link
            href={`/dashboard/clientes/edit/${customerId}`}
            className="text-indigo-600 hover:text-indigo-900"
          >
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-900 ml-4 font-medium"
          >
            Borrar
          </button>
        </>
      )}
    </>
  )
}