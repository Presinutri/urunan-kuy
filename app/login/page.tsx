'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/trips'
  const errorParam = searchParams.get('error')
  const supabase = createClient()

  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [errorParam])

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })
    if (error) {
      setError(error.message || 'Gagal login dengan Google.')
      setLoading(false)
    }
    // If no error, browser will redirect to Google — loading stays true
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials' ? 'Email atau password salah.' : error.message)
        setLoading(false)
        return
      }
      window.location.href = redirect
    } else {
      if (!name.trim()) { setError('Nama tidak boleh kosong.'); setLoading(false); return }
      if (password.length < 6) { setError('Password minimal 6 karakter.'); setLoading(false); return }

      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      })

      if (error) { setError(error.message); setLoading(false); return }

      if (data.session) {
        await supabase.from('profiles').update({ name: name.trim() }).eq('id', data.user!.id)
        window.location.href = redirect
      } else {
        setLoading(false)
        setError('Cek email kamu untuk konfirmasi akun, lalu login.')
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-bg-base)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '350px',
        background: 'radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '2rem 1.5rem', maxWidth: '400px', margin: '0 auto', width: '100%',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          }}>✈️</div>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Urunan<span className="gradient-text">Kuy</span>
          </span>
        </Link>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          Masuk ke akun
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Catat pengeluaran trip bareng circle kamu.
        </p>

        {error && (
          <div className={`alert ${error.includes('Cek email') ? 'alert-info' : 'alert-error'}`} style={{ marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        {!showEmailForm ? (
          /* ====== PRIMARY: Google Login ====== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* Google Button */}
            <button
              className="btn btn-lg"
              onClick={handleGoogleLogin}
              disabled={loading}
              id="btn-google-login"
              style={{
                background: 'white',
                color: '#1f1f1f',
                border: '1px solid rgba(0,0,0,0.1)',
                fontWeight: 600,
                gap: '0.75rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {loading ? (
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                /* Google SVG Icon */
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {loading ? 'Mengarahkan...' : 'Lanjut dengan Google'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>atau</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            </div>

            {/* Email fallback */}
            <button
              className="btn btn-secondary"
              onClick={() => { setShowEmailForm(true); setError('') }}
              id="btn-show-email-form"
            >
              <Mail size={16} /> Masuk dengan Email & Password
            </button>
          </div>
        ) : (
          /* ====== SECONDARY: Email + Password ====== */
          <div>
            {/* Back to Google */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setShowEmailForm(false); setError('') }}
              id="btn-back-to-google"
              style={{ marginBottom: '1.25rem', padding: '0.375rem 0' }}
            >
              ← Kembali
            </button>

            {/* Mode tabs */}
            <div className="segment-control" style={{ marginBottom: '1.25rem' }}>
              <button className={`segment-btn ${mode === 'login' ? 'active' : ''}`} type="button"
                onClick={() => { setMode('login'); setError('') }} id="tab-login">
                Masuk
              </button>
              <button className={`segment-btn ${mode === 'register' ? 'active' : ''}`} type="button"
                onClick={() => { setMode('register'); setError('') }} id="tab-register">
                Daftar
              </button>
            </div>

            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {mode === 'register' && (
                <div className="form-group">
                  <label className="input-label" htmlFor="auth-name">Nama</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input id="auth-name" type="text" className="input" placeholder="Nama kamu"
                      value={name} onChange={e => setName(e.target.value)} required maxLength={80}
                      autoFocus style={{ paddingLeft: '2.5rem' }} />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="input-label" htmlFor="auth-email">Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input id="auth-email" type="email" className="input" placeholder="nama@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} required
                    autoComplete="email" autoFocus={mode === 'login'} style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label" htmlFor="auth-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input id="auth-password" type={showPassword ? 'text' : 'password'} className="input"
                    placeholder={mode === 'login' ? 'Password kamu' : 'Min. 6 karakter'}
                    value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                    style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0, display: 'flex' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !email || !password} id="btn-submit-email">
                {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={18} />}
                {loading ? '...' : mode === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            </form>
          </div>
        )}

        {/* Invite info */}
        <div style={{
          marginTop: '1.75rem', padding: '0.875rem 1rem',
          background: 'var(--color-bg-elevated)', borderRadius: '10px',
          border: '1px solid var(--color-border)',
        }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--color-text-secondary)' }}>🔗 Dapat invite link dari teman?</strong><br />
            Klik link itu langsung — bisa preview trip dulu tanpa login.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-bg-base)' }} />}>
      <LoginForm />
    </Suspense>
  )
}
