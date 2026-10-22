import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

function persistRefreshToken(token: string) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8')
      if (content.includes('GMAIL_REFRESH_TOKEN=')) {
        content = content.replace(/GMAIL_REFRESH_TOKEN=.*/, `GMAIL_REFRESH_TOKEN=${token.trim()}`)
      } else {
        content += `\nGMAIL_REFRESH_TOKEN=${token.trim()}\n`
      }
      fs.writeFileSync(envPath, content, 'utf8')
    }
    process.env.GMAIL_REFRESH_TOKEN = token.trim()
    console.log('✅ GMAIL_REFRESH_TOKEN auto-captured and saved to .env.local!')
  } catch (err) {
    console.warn('Failed to auto-persist refresh token to .env.local:', err)
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Resolve the true public origin on Vercel, reverse proxies, or local dev
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  let siteOrigin = origin
  if (!isLocalEnv && forwardedHost) {
    siteOrigin = `${forwardedProto}://${forwardedHost}`
  } else if (process.env.NEXT_PUBLIC_SITE_URL) {
    siteOrigin = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  } else if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
    siteOrigin = `${forwardedProto}://${forwardedHost}`
  } else if (!isLocalEnv && host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    siteOrigin = `${forwardedProto}://${host}`
  }

  // Fallback for Vercel system deployment URL
  if (process.env.VERCEL_URL && (siteOrigin.includes('localhost') || siteOrigin.includes('127.0.0.1'))) {
    siteOrigin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}`
  }

  // Strict open-redirect protection: only same-site relative paths allowed
  let next = '/'
  if (
    typeof rawNext === 'string' &&
    rawNext.startsWith('/') &&
    !rawNext.startsWith('//') &&
    !rawNext.startsWith('/\\') &&
    !rawNext.includes(':') &&
    !rawNext.includes('\\')
  ) {
    next = rawNext
  }

  // If Supabase returned an OAuth error in query params (e.g. user denied or provider mismatch)
  if (errorParam || errorDescription) {
    const errorMsg = errorDescription || errorParam || 'oauth_error'
    console.error('OAuth Callback Error:', errorMsg)
    return NextResponse.redirect(`${siteOrigin}/?auth_error=${encodeURIComponent(errorMsg)}`)
  }

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.session) {
      // Only capture store sending refresh token if coming from the dedicated connect-gmail flow
      const isStoreGmailConnection = rawNext.includes('/connect-gmail')
      const providerRefreshToken = data.session.provider_refresh_token

      if (isStoreGmailConnection && providerRefreshToken) {
        persistRefreshToken(providerRefreshToken)
      }

      return NextResponse.redirect(`${siteOrigin}${next}`)
    }

    if (error) {
      console.error('Failed to exchange auth code for session:', error.message)
      return NextResponse.redirect(`${siteOrigin}/?auth_error=${encodeURIComponent(error.message)}`)
    }
  }

  // Redirect to home with notice if code was missing
  return NextResponse.redirect(`${siteOrigin}/?auth_error=missing_code`)
}
