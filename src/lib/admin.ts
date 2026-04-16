import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const ADMIN_CLIENT_OPTIONS = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
}

export function createAdminClient() {
  return createClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_CLIENT_OPTIONS
  )
}

// Use this only in files that still depend on schema fields missing in generated types.
export function createLooseAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_CLIENT_OPTIONS)
}