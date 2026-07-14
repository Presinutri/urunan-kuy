'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Users, MapPin, ArrowRight, LogIn } from 'lucide-react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export default function JoinPage() {
  const params = useParams()
  const inviteCode = params.inviteCode as string
  const router = useRouter()
  const supabase = createClient()

  const [trip, setTrip] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [alreadyMember, setAlreadyMember] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [inviteCode])

  async function loadData() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)

    // Find trip by invite code
    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('invite_code', inviteCode)
      .single()

    if (!tripData) {
      setError('Link invite tidak valid atau sudah kadaluarsa.')
      setLoading(false)
      return
    }
    setTrip(tripData)

    // Load members
    const { data: membersData } = await supabase
      .from('trip_members')
      .select('*, profile:profiles(*)')
      .eq('trip_id', tripData.id)

    setMembers(membersData || [])

    // Check if already member
    if (currentUser) {
      const isMember = membersData?.some(m => m.user_id === currentUser.id)
      setAlreadyMember(!!isMember)
    }

    setLoading(false)
  }

  async function handleJoin() {
    if (!user) {
      // Store invite code in session storage and redirect to login
      sessionStorage.setItem('pendingInvite', inviteCode)
      router.push(`/login?redirect=/join/${inviteCode}`)
      return
    }

    setJoining(true)

    const { error: joinError } = await supabase
      .from('trip_members')
      .insert({
        trip_id: trip.id,
        user_id: user.id,
        role: 'member',
      })

    if (joinError && !joinError.message.includes('duplicate')) {
      setError(joinError.message)
      setJoining(false)
      return
    }

    router.push(`/trips/${trip.id}`)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
      <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Link Tidak Valid</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{error}</p>
      <Link href="/trips" className="btn btn-primary" style={{ textDecoration: 'none' }}>Ke Halaman Trips</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', maxWidth: '480px', margin: '0 auto', padding: '0' }}>
      {/* Hero */}
      <div style={{
        padding: '3rem 1.5rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(245,158,11,0.08) 0%, transparent 100%)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <div style={{
          width: '70px', height: '70px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', margin: '0 auto 1rem',
        }}>✈️</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
          Kamu diundang ke
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>{trip.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className={`badge ${trip.status === 'active' ? 'badge-active' : 'badge-settled'}`}>
            {trip.status === 'active' ? '● Aktif' : '✓ Selesai'}
          </span>
          {trip.start_date && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={12} />
              {format(new Date(trip.start_date), 'd MMM yyyy', { locale: localeId })}
              {trip.end_date && ` — ${format(new Date(trip.end_date), 'd MMM yyyy', { locale: localeId })}`}
            </span>
          )}
        </div>
        {trip.description && (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
            {trip.description}
          </p>
        )}
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Members */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Users size={14} /> {members.length} Anggota Saat Ini
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem' }}>
            {members.map(member => (
              <div key={member.user_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                <Avatar profile={member.profile} size="md" />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {member.profile?.name || 'User'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {alreadyMember ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="alert alert-success">
              ✓ Kamu sudah jadi anggota trip ini!
            </div>
            <Link href={`/trips/${trip.id}`} className="btn btn-primary btn-lg" style={{ textDecoration: 'none', justifyContent: 'center' }} id="btn-go-to-trip">
              Lihat Trip <ArrowRight size={18} />
            </Link>
          </div>
        ) : trip.status === 'settled' ? (
          <div className="alert alert-info">
            Trip ini sudah selesai dan tidak menerima anggota baru.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleJoin}
              disabled={joining}
              id="btn-join-trip"
            >
              {joining ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              {joining ? 'Bergabung...' : user ? 'Gabung Trip Ini' : 'Masuk & Gabung Trip'}
            </button>
            {!user && (
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Kamu perlu login dulu. Tenang, prosesnya cepat!
              </p>
            )}
            <div style={{ padding: '0.875rem', background: 'var(--color-bg-elevated)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                ℹ️ Dengan bergabung, kamu bisa lihat pengeluaran trip dan input expense baru.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
