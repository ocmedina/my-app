'use client'

import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast' // <-- IMPORTADO

export default function ProductActions({ productId }: { productId: string }) {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        if (profile) {
          setUserRole(profile.role)
        }
      }
    }
    fetchUserRole()
  }, [])

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres DESACTIVAR este producto?')) {
      return
    }

    const { error } = await supabase.from('products').update({ is_active: false }).match({ id: productId })

    if (error) {
      toast.error(`Error al desactivar el producto: ${error.message}`) // <-- CAMBIADO
    } else {
      toast.success('Producto desactivado exitosamente.') // <-- CAMBIADO
      router.refresh()
    }
  }

  if (userRole === null) return null

  return (
    <>
      {userRole === 'administrador' && (
        <>
          <Link href={`/dashboard/products/edit/${productId}`} className="text-indigo-600 hover:text-indigo-900">
            Editar
          </Link>
          <button onClick={handleDelete} className="text-red-600 hover:text-red-900 ml-4 font-medium">
            Borrar
          </button>
        </>
      )}
    </>
  )
}