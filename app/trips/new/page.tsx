'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Calendar, FileText, MapPin } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default function NewTripPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Create trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (tripError) {
      setError(tripError.message)
      setLoading(false)
      return
    }

    // Add creator as admin member
    await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: user.id,
      role: 'admin',
    })

    router.push(`/trips/${trip.id}`)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header sticky-header" style={{ padding: '1rem' }}>
        <Link href="/trips" className="btn btn-ghost btn-icon" id="btn-back-to-trips">
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Buat Trip Baru</h1>
      </div>

      <div className="page-content" style={{ paddingTop: '1.25rem' }}>
        {/* Hero illustration */}
        <div style={{
          textAlign: 'center',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.06))',
          borderRadius: '16px',
          border: '1px solid rgba(245,158,11,0.12)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🗺️</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Buat trip, invite teman, mulai catat pengeluaran bareng!
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="input-label" htmlFor="trip-name">
              Nama Trip <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                id="trip-name"
                type="text"
                className="input"
                placeholder="cth: Bali Juli 2026"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={100}
                autoFocus
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="trip-description">Deskripsi (opsional)</label>
            <div style={{ position: 'relative' }}>
              <FileText size={16} style={{ position: 'absolute', left: '0.875rem', top: '0.875rem', color: 'var(--color-text-muted)' }} />
              <textarea
                id="trip-description"
                className="input"
                placeholder="Cerita singkat tentang trip ini..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                style={{ paddingLeft: '2.5rem', resize: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="input-label" htmlFor="start-date">
                <Calendar size={11} style={{ marginRight: '0.25rem' }} />
                Mulai
              </label>
              <input
                id="start-date"
                type="date"
                className="input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
            <div className="form-group">
              <label className="input-label" htmlFor="end-date">
                <Calendar size={11} style={{ marginRight: '0.25rem' }} />
                Selesai
              </label>
              <input
                id="end-date"
                type="date"
                className="input"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ padding: '0.875rem', background: 'var(--color-bg-elevated)', borderRadius: '10px', border: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              💡 Setelah trip dibuat, kamu bisa invite anggota via link. Mereka bisa join tanpa install apapun.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading || !name.trim()}
            id="btn-create-trip"
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : '🗺️'}
            {loading ? 'Membuat Trip...' : 'Buat Trip'}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}
