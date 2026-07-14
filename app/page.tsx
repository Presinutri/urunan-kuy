'use client'

import Link from 'next/link'
import { MapPin, Users, Calculator, Zap, ArrowRight, CheckCircle } from 'lucide-react'

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
            Mulai Gratis <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Sudah punya akun? Masuk
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

      {/* Features */}
      <div style={{ padding: '1.5rem', maxWidth: '480px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, textAlign: 'center', marginBottom: '1.25rem' }}>
          Kenapa UrunanKuy?
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            {
              icon: <Zap size={20} />,
              title: 'Input cepat saat on-the-go',
              desc: 'Tambah expense dalam <15 detik. Didesain untuk dipakai di jalan, bukan di depan laptop.',
              color: '#f59e0b',
            },
            {
              icon: <Calculator size={20} />,
              title: 'Debt simplification otomatis',
              desc: 'Algoritma minimisasi transaksi — kalau 5 orang perlu settle, bukan berarti 20 transfer. Mungkin cukup 4.',
              color: '#14b8a6',
            },
            {
              icon: <Users size={20} />,
              title: 'Join trip via link',
              desc: 'Kirim invite link ke teman. Mereka langsung join tanpa perlu install apapun.',
              color: '#8b5cf6',
            },
            {
              icon: <MapPin size={20} />,
              title: 'Settle up trip selesai',
              desc: 'Begitu trip kelar, ada flow jelas untuk kelarin semua utang sekaligus — bukan saldo ngambang tanpa batas waktu.',
              color: '#ef4444',
            },
          ].map(feat => (
            <div key={feat.title} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${feat.color}20`,
                border: `1px solid ${feat.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: feat.color,
                flexShrink: 0,
              }}>
                {feat.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{feat.title}</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{feat.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* vs Splitwise */}
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, textAlign: 'center', marginBottom: '1rem' }}>
            vs Splitwise Free
          </h2>
          <div className="card">
            {[
              { label: 'Entri expense per hari', urunan: 'Tanpa batas ✓', splitwise: '~3/hari ✗' },
              { label: 'Ads', urunan: 'Tidak ada ✓', splitwise: 'Ada ✗' },
              { label: 'Debt simplification', urunan: 'Gratis ✓', splitwise: 'Gratis ✓' },
              { label: 'Settle up per trip', urunan: 'Ada ✓', splitwise: 'Tidak ada ✗' },
              { label: 'Join via link', urunan: 'Mudah ✓', splitwise: 'Perlu daftar ✗' },
            ].map((row, i) => (
              <div key={row.label} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.5rem',
                padding: '0.75rem 0',
                borderBottom: i < 4 ? '1px solid var(--color-border-subtle)' : 'none',
                fontSize: '0.8rem',
                alignItems: 'center',
              }}>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{row.label}</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600, textAlign: 'center' }}>{row.urunan}</span>
                <span style={{ color: 'var(--color-danger)', fontWeight: 600, textAlign: 'center' }}>{row.splitwise}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div style={{
          marginTop: '2.5rem',
          textAlign: 'center',
          padding: '2rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.08))',
          borderRadius: '20px',
          border: '1px solid rgba(245,158,11,0.15)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🌏</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Siap untuk trip berikutnya?
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            Buat trip, invite circle, dan mulai catat pengeluaran — gratis, tanpa batas.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Buat Trip Pertama <ArrowRight size={16} />
          </Link>
        </div>

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
