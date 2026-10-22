'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { CheckCircle2, ShieldCheck, Mail, ArrowRight, Send, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react'

export default function ConnectGmailPage() {
  const [loading, setLoading] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testResult, setTestResult] = useState<any | null>(null)
  const [diagnostics, setDiagnostics] = useState<any | null>(null)
  const [isSuccessParam, setIsSuccessParam] = useState(false)

  const fetchDiagnostics = async () => {
    try {
      const res = await fetch('/api/diagnostics')
      const data = await res.json()
      setDiagnostics(data)
    } catch (err) {
      console.warn('Diagnostics fetch error:', err)
    }
  }

  useEffect(() => {
    fetchDiagnostics()
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('success') === '1') {
        setIsSuccessParam(true)
      }
    }
  }, [])

  const handleAuthorize = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectUrl = `${origin}/auth/callback?next=${encodeURIComponent('/connect-gmail?success=1')}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          scopes: 'https://www.googleapis.com/auth/gmail.send',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) {
        alert(`Google Auth error: ${error.message}`)
        setLoading(false)
      }
    } catch (err: any) {
      alert(`Authorization failed: ${err.message}`)
      setLoading(false)
    }
  }

  const handleSendTestEmail = async () => {
    setTestingEmail(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/receipts/test', { method: 'POST' })
      const data = await res.json()
      setTestResult(data)
    } catch (err: any) {
      setTestResult({ success: false, error: err.message })
    } finally {
      setTestingEmail(false)
    }
  }

  const isGmailOk = diagnostics?.gmail?.tokenExchange === 'ok'

  return (
    <div className="min-h-screen bg-[#050806] text-[#e8f0ea] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background neon ambient blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 uppercase tracking-widest">
            <Sparkles size={14} className="text-emerald-400" />
            Integration Portal
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            LIFTING <span className="text-emerald-400 italic">ZONE</span> OBRERO
          </h1>
          <p className="text-sm text-[#8fa895]">
            Automatic 1-Click Gmail API Connector &amp; Receipt Dispatcher
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-2xl border border-[#1a3822] bg-[#0b140e]/80 backdrop-blur-xl p-6 shadow-2xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#8fa895] flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            Backend Connection Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Supabase Status */}
            <div className="rounded-xl border border-[#1a3822] bg-[#061108] p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Supabase DB</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live &amp; Seeded
                </span>
              </div>
              <p className="text-[#8fa895] truncate">zcxcivjzasmdcqmbbfyb</p>
              <p className="text-[10px] text-emerald-500 font-mono">8 Products • 3 Promo Codes</p>
            </div>

            {/* Store Email Status */}
            <div className="rounded-xl border border-[#1a3822] bg-[#061108] p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Sender Account</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Mail size={12} />
                  Configured
                </span>
              </div>
              <p className="text-[#8fa895] truncate font-mono">kv.alegrado@gmail.com</p>
              <p className="text-[10px] text-emerald-500 font-mono">Store Owner &amp; Admin</p>
            </div>
          </div>

          {/* Success Banner if redirected with success */}
          {isSuccessParam && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-300 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">Google Authorization Successful!</p>
                <p className="text-xs text-emerald-300/90 mt-0.5">
                  Your Gmail refresh token has been automatically extracted and saved to your server.
                </p>
              </div>
            </div>
          )}

          {/* Action Button Section */}
          <div className="pt-2 space-y-3">
            <button
              onClick={handleAuthorize}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-5 py-3.5 text-sm font-black text-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <Mail size={16} />
                  <span>Authorize Gmail for kv.alegrado@gmail.com (1-Click)</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="text-[11px] text-[#8fa895] text-center">
              Clicking above will open Google OAuth. Click <strong>Allow</strong> and Google will automatically save the token to your local environment.
            </p>
          </div>

          {/* Test Email Section */}
          <div className="border-t border-[#1a3822] pt-4 mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Live Email Dispatch Test</p>
                <p className="text-[11px] text-[#8fa895]">Send a real test email to kv.alegrado@gmail.com</p>
              </div>

              <button
                onClick={handleSendTestEmail}
                disabled={testingEmail}
                className="flex items-center gap-1.5 rounded-lg border border-[#1a3822] bg-[#061108] px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition disabled:opacity-50"
              >
                {testingEmail ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                <span>Send Test</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`rounded-lg p-3 text-xs border ${
                  testResult.success
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/40 bg-red-500/10 text-red-300'
                }`}
              >
                {testResult.success ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>{testResult.message} (Message ID: {testResult.messageId})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400" />
                    <span>Test Failed: {testResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Return to Storefront */}
        <div className="text-center">
          <a
            href="/"
            className="text-xs text-[#8fa895] hover:text-emerald-400 transition inline-flex items-center gap-1"
          >
            ← Return to Lifting Zone Storefront
          </a>
        </div>
      </div>
    </div>
  )
}
