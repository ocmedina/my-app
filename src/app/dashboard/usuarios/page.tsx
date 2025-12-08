'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { FaUserPlus, FaKey } from 'react-icons/fa'
import { createEmployee } from '@/app/actions/userActions'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import ChangePasswordModal from '@/components/ChangePasswordModal'

/* ==============================
   MODAL: NUEVO USUARIO
============================== */
function NewUserModal({
  isOpen,
  onClose,
  onUserCreated,
}: {
  isOpen: boolean
  onClose: () => void
  onUserCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  if (!isOpen) return null

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    const result = await createEmployee(formData)
    setLoading(false)

    if (result.success) {
      toast.success(result.message)
      onUserCreated()
      onClose()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Crear Nuevo Empleado</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:text-slate-100"
          >
            ✕
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Nombre Completo
            </label>
            <input
              name="fullName"
              required
              className="mt-1 w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Usuario
            </label>
            <input
              name="username"
              pattern="[a-zA-Z0-9._-]+"
              required
              className="mt-1 w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md"
              placeholder="juan.perez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md"
              placeholder="juan@empresa.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Contraseña Temporal
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md"
              placeholder="******"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Rol
            </label>
            <select
              name="role"
              defaultValue="vendedor"
              required
              className="mt-1 w-full p-2 border border-gray-300 dark:border-slate-600 rounded-md"
            >
              <option value="vendedor">Vendedor</option>
              <option value="administrador">Administrador</option>
              <option value="repartidor">Repartidor</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ==============================
   PÁGINA PRINCIPAL DE USUARIOS
============================== */
function UsersPageContent() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const { can } = useAuth()

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('id', { ascending: false })

    if (error) toast.error('Error al cargar usuarios')
    else setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRoleChange = async (id: string, newRole: string) => {
    if (!can('CAMBIAR_ROLES')) {
      toast.error('Sin permisos para cambiar roles')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id)
    if (error) toast.error('Error al actualizar rol')
    else {
      toast.success('Rol actualizado')
      fetchUsers()
    }
  }

  const handleStatusChange = async (id: string, current: boolean) => {
    if (!can('EDITAR_USUARIOS')) {
      toast.error('Sin permisos para cambiar estado')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !current })
      .eq('id', id)
    if (error) toast.error('Error al actualizar estado')
    else {
      toast.success('Estado actualizado')
      fetchUsers()
    }
  }

  const openPasswordModal = (user: any) => {
    if (!can('EDITAR_USUARIOS')) {
      toast.error('Sin permisos para cambiar contraseñas')
      return
    }
    setSelectedUser(user)
    setIsPasswordModalOpen(true)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        {can('CREAR_USUARIOS') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FaUserPlus /> Crear Usuario
          </button>
        )}
      </div>

      {/* MODALES */}
      <NewUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={fetchUsers}
      />
      {selectedUser && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
        />
      )}

      {/* TABLA DE USUARIOS */}
      <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
          <thead className="bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-slate-300 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">Nombre</th>
              <th className="px-6 py-3 text-left">Usuario</th>
              <th className="px-6 py-3 text-left">Rol</th>
              <th className="px-6 py-3 text-left">Estado</th>
              <th className="px-6 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-10">
                  Cargando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-slate-400">
                  No hay usuarios
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-3">{u.full_name}</td>
                  <td className="px-6 py-3">{u.username}</td>
                  <td className="px-6 py-3">
                    {can('CAMBIAR_ROLES') ? (
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value)
                        }
                        className="border rounded-md p-1"
                      >
                        <option value="vendedor">Vendedor</option>
                        <option value="administrador">Administrador</option>
                        <option value="repartidor">Repartidor</option>
                      </select>
                    ) : (
                      u.role
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${u.is_active
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}
                    >
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-3 space-x-3">
                    {can('EDITAR_USUARIOS') && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusChange(u.id, u.is_active)
                          }
                          className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:text-slate-50"
                        >
                          {u.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => openPasswordModal(u)}
                          className="text-blue-600 hover:text-blue-900 ml-2"
                        >
                          <FaKey className="inline mr-1" /> Contraseña
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function UsersPage() {
  return (
    <ProtectedRoute permission="VER_USUARIOS">
      <UsersPageContent />
    </ProtectedRoute>
  )
}
