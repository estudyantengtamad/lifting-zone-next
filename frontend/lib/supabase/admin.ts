import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Server-only boundary check
if (typeof window !== 'undefined') {
  throw new Error('Security Violation: Supabase service-role admin client cannot be imported on the browser.')
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !url ||
    !serviceKey ||
    url.includes('placeholder') ||
    url.includes('your-project') ||
    serviceKey === 'your-service-role-key' ||
    serviceKey === 'your-service-role-key-for-backend-admin'
  ) {
    return null
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
