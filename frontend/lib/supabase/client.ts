import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(
    url &&
    key &&
    !url.includes('placeholder') &&
    !url.includes('your-project') &&
    key !== 'placeholder' &&
    key !== 'your-anon-key'
  )
}

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

  browserClient = createBrowserClient<Database>(url, key)
  return browserClient
}
