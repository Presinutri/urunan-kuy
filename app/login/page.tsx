'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, User } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/trips'

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'Email atau password salah.'
            : error.message || 'Terjadi kesalahan, coba lagi.'
        )
        setLoading(false)
        return
      }
      router.push(redirect)
      router.refresh()
    } else {
      // Register
      if (!name.trim()) {
        setError('Nama tidak boleh kosong.')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Password minimal 6 karakter.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      })

      if (error) {
        setError(error.message || 'Terjadi kesalahan saat daftar.')
        setLoading(false)
        return
      }

      // If email confirmation is disabled, user is logged in directly
      if (data.session) {
        // Update profile name
        await supabase.from('profiles').update({ name: name.trim() }).eq('id', data.user!.id)
        router.push(redirect)
        router.refresh()
      } else {
        // Email confirmation is enabled — show message
        setLoading(false)
        setError('') 
        // Switch to a "check email" state
        setMode('login')
        setError('Akun berhasil dibuat! Cek email kamu untuk konfirmasi (jika diperlukan), lalu login.')
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-base)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed',
        top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: '400px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(245,158,11,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '2rem 1.5rem',
        maxWidth: '400px', margin: '0 auto', width: '100%',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
          }}>✈️</div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Urunan<span className="gradient-text">Kuy</span>
          </span>
        </Link>

        {/* Mode Switcher */}
        <div className="segment-control" style={{ marginBottom: '1.75rem' }}>
          <button
            className={`segment-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError('') }}
            id="tab-login"
            type="button"
          >
            Masuk
          </button>
          <button
            className={`segment-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError('') }}
            id="tab-register"
            type="button"
          >
            Daftar
          </button>
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.375rem' }}>
          {mode === 'login' ? 'Masuk ke akun' : 'Buat akun baru'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {mode === 'login'
            ? 'Masukkan email dan password kamu.'
            : 'Daftar gratis — tidak perlu kartu kredit.'}
        </p>

        {error && (
          <div className={`alert ${error.includes('berhasil') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Name (register only) */}
          {mode === 'register' && (
            <div className="form-group">
              <label className="input-label" htmlFor="auth-name">Nama</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  id="auth-name"
                  type="text"
                  className="input"
                  placeholder="Nama kamu"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={mode === 'register'}
                  maxLength={80}
                  autoFocus={mode === 'register'}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="input-label" htmlFor="auth-email">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                id="auth-email"
                type="email"
                className="input"
                placeholder="nama@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus={mode === 'login'}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="input-label" htmlFor="auth-password">
              Password {mode === 'register' && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, textTransform: 'none' }}>(min. 6 karakter)</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder={mode === 'login' ? 'Password kamu' : 'Buat password baru'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0,
                  display: 'flex', alignItems: 'center',
                }}
                tabIndex={-1}
                id="btn-toggle-password"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading || !email || !password}
            id="btn-submit-auth"
            style={{ marginTop: '0.25rem' }}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={18} />}
            {loading
              ? (mode === 'login' ? 'Masuk...' : 'Mendaftar...')
              : (mode === 'login' ? 'Masuk' : 'Daftar Sekarang')
            }
          </button>
        </form>

        {/* Join via link info */}
        <div style={{
          marginTop: '1.5rem', padding: '1rem',
          background: 'var(--color-bg-elevated)',
          borderRadius: '10px', border: '1px solid var(--color-border)',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--color-text-secondary)' }}>🔗 Dapat invite link dari teman?</strong><br />
            Langsung klik link itu — kamu bisa preview trip dulu. Daftar/masuk hanya perlu saat mau input pengeluaran.
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
