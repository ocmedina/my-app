import { createClient } from '@supabase/supabase-js';

// Cliente con privilegios de administrador
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ NUNCA expongas esta key en el cliente
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);