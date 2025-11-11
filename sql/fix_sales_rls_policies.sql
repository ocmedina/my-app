-- Arreglar políticas RLS para permitir actualizar ventas (incluyendo is_cancelled)
-- Ejecutar en Supabase SQL Editor

-- 1. Ver las políticas actuales
SELECT * FROM pg_policies WHERE tablename = 'sales';

-- 2. Eliminar política restrictiva de UPDATE si existe
DROP POLICY IF EXISTS "Users can update their own sales" ON sales;
DROP POLICY IF EXISTS "Users can update sales in their organization" ON sales;

-- 3. Crear nueva política de UPDATE que permita a todos los usuarios autenticados actualizar ventas
CREATE POLICY "Authenticated users can update sales"
ON sales
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Verificar que la política se creó correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'sales' AND cmd = 'UPDATE';
