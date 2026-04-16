import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ NUNCA expongas esta key en el cliente
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Cliente con privilegios de administrador
export const supabaseAdmin = createAdminClient();