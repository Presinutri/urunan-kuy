'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip, TripMember } from '@/lib/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, MapPin, Users, ChevronRight, Loader2, LogOut } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import Avatar from '@/components/Avatar'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface TripWithMeta extends Trip {
  member_count: number
  total_expense: number
}

export default function TripsPage() {
  const [trips, setTrips] = useState<TripWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    if (profile) setUserName(profile.name)

    // Process pending invite if any
    const pendingInvite = sessionStorage.getItem('pendingInvite')
    if (pendingInvite) {
      sessionStorage.removeItem('pendingInvite')
      const { data: tripToJoin } = await supabase.from('trips').select('id').eq('invite_code', pendingInvite).single()
      if (tripToJoin) {
        await supabase.from('trip_members').insert({
          trip_id: tripToJoin.id,
          user_id: user.id,
          role: 'member'
        })
        router.push(`/trips/${tripToJoin.id}`)
        return
      }
    }

    // Get trips with member count
    const { data: memberRows } = await supabase
      .from('trip_members')
      .select('trip_id')
      .eq('user_id', user.id)

    if (!memberRows || memberRows.length === 0) {
      setLoading(false)
      return
    }

    const tripIds = memberRows.map(r => r.trip_id)

    const { data: tripsData } = await supabase
      .from('trips')
      .select('*')
      .in('id', tripIds)
      .order('created_at', { ascending: false })

    if (!tripsData) {
      setLoading(false)
      return
    }

    // Get member counts and totals
    const enriched = await Promise.all(tripsData.map(async (trip) => {
      const [{ count: memberCount }, { data: expenseData }] = await Promise.all([
        supabase.from('trip_members').select('*', { count: 'exact', head: true }).eq('trip_id', trip.id),
        supabase.from('expenses').select('amount').eq('trip_id', trip.id),
      ])

      const totalExpense = expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0

      return {
        ...trip,
        member_count: memberCount ?? 0,
        total_expense: totalExpense,
      }
    }))

    setTrips(enriched)
    setLoading(false)
  }

  const filtered = trips.filter(t => filter === 'all' ? true : t.status === filter)

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  function formatRupiah(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="sticky-header" style={{ padding: '1rem 1rem 0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
              <span style={{ fontSize: '1.2rem' }}>✈️</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>UrunanKuy</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Halo, {userName || 'traveler'}! 👋
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Keluar" id="btn-logout">
            <LogOut size={18} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
          {(['all', 'active', 'settled'] as const).map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
              id={`filter-${f}`}
              style={{ fontSize: '0.75rem' }}
            >
              {f === 'all' ? 'Semua' : f === 'active' ? '🟢 Aktif' : '✅ Selesai'}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🌏</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
              {filter === 'all' ? 'Belum ada trip' : filter === 'active' ? 'Belum ada trip aktif' : 'Belum ada trip selesai'}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {filter === 'all' ? 'Buat trip pertamamu dan ajak circle traveling!' : 'Coba filter lain.'}
            </p>
            {filter === 'all' && (
              <Link href="/trips/new" className="btn btn-primary" id="btn-create-first-trip" style={{ textDecoration: 'none' }}>
                <Plus size={16} /> Buat Trip Pertama
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem', animation: 'fadeInUp 0.3s ease' }}>
            {filtered.map(trip => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                id={`trip-card-${trip.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span className={`badge ${trip.status === 'active' ? 'badge-active' : 'badge-settled'}`}>
                          {trip.status === 'active' ? '● Aktif' : '✓ Selesai'}
                        </span>
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {trip.name}
                      </h3>
                      {trip.start_date && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={11} />
                          {format(new Date(trip.start_date), 'd MMM yyyy', { locale: localeId })}
                          {trip.end_date && ` — ${format(new Date(trip.end_date), 'd MMM yyyy', { locale: localeId })}`}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '0.25rem' }} />
                  </div>
                  <div className="divider" style={{ margin: '0.75rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      <Users size={13} />
                      <span>{trip.member_count} anggota</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {formatRupiah(trip.total_expense)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link href="/trips/new" id="fab-new-trip" style={{ textDecoration: 'none' }}>
        <button className="fab" aria-label="Buat trip baru">
          <Plus size={24} />
        </button>
      </Link>

      <BottomNav />
    </div>
  )
}
