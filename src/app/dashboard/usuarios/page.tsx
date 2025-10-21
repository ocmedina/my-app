'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { FaUserPlus, FaTimes } from 'react-icons/fa';
import { createEmployee } from '@/app/actions/userActions';

// Componente para el Modal de creación de usuario
function NewUserModal({ isOpen, onClose, onUserCreated }: { isOpen: boolean; onClose: () => void; onUserCreated: () => void; }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    const result = await createEmployee(formData);
    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      onUserCreated(); // Llama a la función para refrescar la lista de usuarios
      onClose();      // Cierra el modal
    } else {
      toast.error(result.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Crear Nuevo Empleado</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><FaTimes /></button>
        </div>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
            <input name="fullName" type="text" required className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" required className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña Temporal</label>
            <input name="password" type="password" required className="mt-1 w-full p-2 border border-gray-300 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rol</label>
            <select name="role" defaultValue="vendedor" required className="mt-1 w-full p-2 border border-gray-300 rounded-md">
              <option value="vendedor">Vendedor</option>
              <option value="administrador">Administrador</option>
              <option value="repartidor">Repartidor</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-400">
              {loading ? 'Creando...' : 'Crear Empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    // No reseteamos el loading a true aquí para que la recarga sea más suave
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      toast.error('Error al cargar los usuarios.');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) {
      toast.error('No se pudo cambiar el rol.');
    } else {
      toast.success('Rol actualizado.');
      fetchUsers(); // Recarga la lista
    }
  };

  const handleStatusChange = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_active: !currentStatus }).eq('id', userId);
    if (error) {
      toast.error('No se pudo cambiar el estado.');
    } else {
      toast.success('Estado del usuario actualizado.');
      fetchUsers(); // Recarga la lista
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <FaUserPlus /> Crear Nuevo Empleado
        </button>
      </div>

      <NewUserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUserCreated={fetchUsers}
      />
      
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-10">Cargando...</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.full_name || 'Sin nombre'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select value={user.role} onChange={e => handleRoleChange(user.id, e.target.value)} className="p-1 border rounded-md text-sm bg-gray-50">
                      <option value="vendedor">Vendedor</option>
                      <option value="administrador">Administrador</option>
                      <option value="repartidor">Repartidor</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleStatusChange(user.id, user.is_active)} className="text-sm text-gray-600 hover:text-gray-900">
                      {user.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}