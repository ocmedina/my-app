'use client'

import { useAuth } from '@/hooks/useAuth'

export default function DebugPage() {
  const { user, profile, role, can } = useAuth()

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">🔍 Debug Usuario</h1>
      <pre className="bg-gray-100 p-3 rounded">{JSON.stringify({ role, profile }, null, 2)}</pre>

      <p className="mt-3">
        Puede ver usuarios: {can('VER_USUARIOS') ? '✅ Sí' : '❌ No'}
      </p>
    </div>
  )
}
