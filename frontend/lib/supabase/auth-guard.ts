import { createClient } from './server'
import { createAdminClient } from './admin'
import { isSupabaseConfigured } from './client'
import { NextResponse } from 'next/server'

export type AuthContext = {
  user: {
    id: string
    email: string
    user_metadata?: Record<string, any>
  }
  profile: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: 'customer' | 'admin'
  }
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number = 401) {
    super(message)
    this.status = status
    this.name = 'AuthError'
  }
}

export async function requireUser(req?: Request): Promise<AuthContext> {
  if (!isSupabaseConfigured()) {
    throw new AuthError('Authentication service is not configured on this server.', 503)
  }

  const supabase = createClient()
  let user = null

  // 1. Try bearer token from request header if available
  if (req) {
    const authHeader = req.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim()
      const { data, error } = await supabase.auth.getUser(token)
      if (!error && data?.user) {
        user = data.user
      }
    }
  }

  // 2. Try cookie session
  if (!user) {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      throw new AuthError('Authentication required. Please sign in with Google.', 401)
    }
    user = data.user
  }

  if (!user.email) {
    throw new AuthError('Valid email required for authenticated operations.', 401)
  }

  // 3. Fetch profile with role (use admin client if available to ensure bypass of RLS recursion)
  const adminClient: any = createAdminClient() || supabase
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let role: 'customer' | 'admin' = ((profile as any)?.role as 'customer' | 'admin') || 'customer'

  // Double check admin_emails allowlist in case profile has not synced yet
  if (role !== 'admin') {
    const { data: adminRecord } = await adminClient
      .from('admin_emails')
      .select('email')
      .ilike('email', user.email)
      .maybeSingle()

    if (adminRecord) {
      role = 'admin'
      // Proactively update profile role
      await adminClient
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          role: 'admin',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
        })
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    },
    profile: {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      role
    }
  }
}

export async function requireAdmin(req?: Request): Promise<AuthContext> {
  const auth = await requireUser(req)

  if (auth.profile.role !== 'admin') {
    throw new AuthError('Forbidden: Administrator privileges required for this action.', 403)
  }

  return auth
}

export function handleAuthError(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: err.status }
    )
  }
  const message = err instanceof Error ? err.message : 'Internal Server Error'
  return NextResponse.json({ success: false, error: message }, { status: 500 })
}
