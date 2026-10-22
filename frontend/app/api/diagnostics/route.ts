import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'
import { createClient as createServerSupabase } from '../../../lib/supabase/server'
import { isSupabaseConfigured } from '../../../lib/supabase/client'

export async function GET() {
  const diagnostics: {
    timestamp: string
    supabase: {
      configured: boolean
      urlSet: boolean
      anonKeySet: boolean
      serviceKeySet: boolean
      dbConnection: 'ok' | 'failed' | 'not_configured'
      tablesDetected?: {
        products: boolean
        orders: boolean
        profiles: boolean
        admin_emails: boolean
      }
      error?: string
    }
    gmail: {
      configured: boolean
      clientIdSet: boolean
      clientSecretSet: boolean
      refreshTokenSet: boolean
      senderAddressSet: boolean
      tokenExchange: 'ok' | 'failed' | 'not_configured'
      senderAddress?: string
      error?: string
    }
    authConfig: {
      environment: string
      siteUrlConfigured: string
      requiredSupabaseRedirectUrls: string[]
      googleAuthorizedRedirectUris: string[]
    }
  } = {
    timestamp: new Date().toISOString(),
    supabase: {
      configured: isSupabaseConfigured(),
      urlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')),
      anonKeySet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')),
      serviceKeySet: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')),
      dbConnection: 'not_configured'
    },
    gmail: {
      configured: Boolean(
        process.env.GMAIL_CLIENT_ID &&
        process.env.GMAIL_CLIENT_SECRET &&
        process.env.GMAIL_REFRESH_TOKEN &&
        !process.env.GMAIL_REFRESH_TOKEN.includes('your-')
      ),
      clientIdSet: Boolean(process.env.GMAIL_CLIENT_ID && !process.env.GMAIL_CLIENT_ID.includes('your-')),
      clientSecretSet: Boolean(process.env.GMAIL_CLIENT_SECRET && !process.env.GMAIL_CLIENT_SECRET.includes('your-')),
      refreshTokenSet: Boolean(process.env.GMAIL_REFRESH_TOKEN && !process.env.GMAIL_REFRESH_TOKEN.includes('your-')),
      senderAddressSet: Boolean(process.env.GMAIL_SENDER_ADDRESS),
      tokenExchange: 'not_configured',
      senderAddress: process.env.GMAIL_SENDER_ADDRESS
    },
    authConfig: {
      environment: process.env.NODE_ENV || 'development',
      siteUrlConfigured: process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
      requiredSupabaseRedirectUrls: [
        'https://liftingzonebutuan.vercel.app/**',
        'https://liftingzonebutuan.vercel.app/auth/callback',
        'https://*.vercel.app/**',
        'http://localhost:3000/**',
        'http://localhost:3000/auth/callback'
      ],
      googleAuthorizedRedirectUris: [
        'https://zcxcivjzasmdcqmbbfyb.supabase.co/auth/v1/callback'
      ]
    }
  }

  // 1. Supabase Database Test
  if (diagnostics.supabase.configured) {
    try {
      const supabase: any = createAdminClient() || createServerSupabase()
      
      const [productsRes, ordersRes, profilesRes, adminsRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('admin_emails').select('email', { count: 'exact', head: true })
      ])

      diagnostics.supabase.tablesDetected = {
        products: !productsRes.error,
        orders: !ordersRes.error,
        profiles: !profilesRes.error,
        admin_emails: !adminsRes.error
      }

      if (!productsRes.error && !ordersRes.error) {
        diagnostics.supabase.dbConnection = 'ok'
      } else {
        diagnostics.supabase.dbConnection = 'failed'
        diagnostics.supabase.error = productsRes.error?.message || ordersRes.error?.message || 'Table query failed'
      }
    } catch (err: any) {
      diagnostics.supabase.dbConnection = 'failed'
      diagnostics.supabase.error = err.message || 'Connection error'
    }
  }

  // 2. Gmail API Token Exchange Test
  if (diagnostics.gmail.configured) {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.GMAIL_CLIENT_ID || '',
          client_secret: process.env.GMAIL_CLIENT_SECRET || '',
          refresh_token: process.env.GMAIL_REFRESH_TOKEN || ''
        })
      })

      const tokenData = await res.json()
      if (res.ok && tokenData.access_token) {
        diagnostics.gmail.tokenExchange = 'ok'
      } else {
        diagnostics.gmail.tokenExchange = 'failed'
        diagnostics.gmail.error = tokenData.error_description || tokenData.error || 'Token exchange failed'
      }
    } catch (err: any) {
      diagnostics.gmail.tokenExchange = 'failed'
      diagnostics.gmail.error = err.message || 'Fetch error connecting to Google OAuth'
    }
  }

  return NextResponse.json(diagnostics)
}
