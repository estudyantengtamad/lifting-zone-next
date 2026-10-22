import { create } from 'zustand'
import { createClient, isSupabaseConfigured } from './supabase/client'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'customer' | 'admin'
}

interface AuthState {
  user: any | null
  profile: UserProfile | null
  role: 'customer' | 'admin' | null
  loading: boolean
  initialized: boolean
  error: string | null

  init: () => Promise<void>
  signInWithGoogle: (nextPath?: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  role: null,
  loading: true,
  initialized: false,
  error: null,

  init: async () => {
    if (!isSupabaseConfigured()) {
      set({ loading: false, initialized: true, user: null, profile: null, role: null })
      return
    }

    try {
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        set({ user: null, profile: null, role: null, loading: false, initialized: true })
        return
      }

      const user = session.user

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      const role: 'customer' | 'admin' = ((profile as any)?.role as 'customer' | 'admin') || 'customer'

      set({
        user,
        profile: profile || {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          role
        },
        role,
        loading: false,
        initialized: true
      })

      // Setup auth state listener
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (newSession?.user) {
            const { data: updatedProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newSession.user.id)
              .maybeSingle()

            const updatedRole: 'customer' | 'admin' = ((updatedProfile as any)?.role as 'customer' | 'admin') || 'customer'
            set({
              user: newSession.user,
              profile: updatedProfile || null,
              role: updatedRole,
              loading: false
            })
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, role: null, loading: false })
        }
      })
    } catch (err: any) {
      console.warn('Auth init notice:', err)
      set({ loading: false, initialized: true, error: err.message })
    }
  },

  signInWithGoogle: async (nextPath = '/') => {
    if (!isSupabaseConfigured()) {
      alert('Google Login is currently unavailable: Supabase credentials are not configured.')
      return
    }

    try {
      set({ loading: true, error: null })
      const supabase = createClient()
      let origin = ''
      if (typeof window !== 'undefined' && window.location.origin) {
        origin = window.location.origin
      } else if (process.env.NEXT_PUBLIC_SITE_URL) {
        origin = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
      }
      const safeNext = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/'
      const redirectUrl = `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) {
        set({ error: error.message, loading: false })
        alert(`Google Sign-In Error: ${error.message}`)
      }
    } catch (err: any) {
      set({ error: err.message, loading: false })
      alert(`Sign in failed: ${err.message}`)
    }
  },

  signOut: async () => {
    if (!isSupabaseConfigured()) {
      set({ user: null, profile: null, role: null })
      return
    }

    try {
      set({ loading: true })
      const supabase = createClient()
      await supabase.auth.signOut()
      set({ user: null, profile: null, role: null, loading: false })
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  refresh: async () => {
    await get().init()
  }
}))
