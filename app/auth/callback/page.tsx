'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const code = searchParams.get('code')
    const redirect = searchParams.get('redirect') || '/trips'
    
    if (code) {
      // Exchange the code on the client side.
      // This bypasses Netlify's SSR cookie bugs entirely because cookies
      // are set natively in the browser via JavaScript.
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          router.push(`/login?error=${encodeURIComponent(error.message)}`)
        } else {
          // Hard redirect so proxy.ts gets a fresh request with cookies
          window.location.href = redirect
        }
      })
    } else {
      window.location.href = redirect
    }
  }, [searchParams, router, supabase])

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-base)' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: 'var(--color-primary)' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Menyiapkan sesi kamu...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', background: 'var(--color-bg-base)' }} />}>
      <CallbackHandler />
    </Suspense>
  )
}
