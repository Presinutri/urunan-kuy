'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Hero Section */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '3rem 1.5rem 2rem',
        textAlign: 'center',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
          }}>✈️</div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Urunan<span className="gradient-text">Kuy</span>
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 8vw, 3rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: '1rem',
          color: 'var(--color-text-primary)',
        }}>
          Split bill traveling<br />
          <span className="gradient-text">tanpa ribet</span>
        </h1>

        <p style={{
          fontSize: '1.05rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '400px',
          margin: '0 auto 2rem',
          lineHeight: 1.7,
        }}>
          Catat pengeluaran, hitung siapa utang ke siapa, dan settle up — tanpa batas entri harian. Gratis selamanya.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '320px', margin: '0 auto' }}>
          <Link href="/login" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
            Mulai <ArrowRight size={18} />
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginTop: '2.5rem',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Tanpa limit harian', icon: '∞' },
            { label: 'Gratis selamanya', icon: '💚' },
            { label: 'Tanpa install app', icon: '🌐' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: '480px', margin: '0 auto' }}>
        <p style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          marginTop: '2rem',
          paddingBottom: '2rem',
        }}>
          Made with ☕ by Fariz Albab — UrunanKuy v1.0
        </p>
      </div>
    </div>
  )
}
