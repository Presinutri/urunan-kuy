'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip, TripMember, Expense, NetBalance } from '@/lib/types'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Users, Receipt, Scale, CheckCircle2,
  Share2, History, Settings, ChevronRight, Copy, Check,
  Loader2, Clock, TrendingUp
} from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import Avatar from '@/components/Avatar'
import { formatRupiah } from '@/lib/debt-simplifier'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export default function TripDetailPage() {
  const params = useParams()
  const tripId = params.tripId as string
  const router = useRouter()
  const supabase = createClient()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<TripMember[]>([])
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [totalExpense, setTotalExpense] = useState(0)
  const [myBalance, setMyBalance] = useState(0)
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    loadData()
  }, [tripId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    // Load trip
    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (!tripData) {
      router.push('/trips')
      return
    }
    setTrip(tripData)

    // Load members with profiles
    const { data: membersData } = await supabase
      .from('trip_members')
      .select('*, profile:profiles(*)')
      .eq('trip_id', tripId)

    setMembers(membersData || [])
    const me = membersData?.find(m => m.user_id === user.id)
    setIsAdmin(me?.role === 'admin')

    // Load recent expenses
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*, payer:profiles!paid_by(*)')
      .eq('trip_id', tripId)
      .order('date', { ascending: false })
      .limit(5)

    setRecentExpenses(expensesData || [])

    // Total expense
    const { data: allExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('trip_id', tripId)
    const total = allExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
    setTotalExpense(total)

    // My balance: what I paid - what I owe
    const { data: splits } = await supabase
      .from('expense_splits')
      .select('share_amount, expense:expenses!inner(paid_by, trip_id)')
      .eq('expense.trip_id', tripId)
      .eq('user_id', user.id)

    const { data: myExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('trip_id', tripId)
      .eq('paid_by', user.id)

    const totalPaid = myExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
    const totalOwed = splits?.reduce((sum: number, s: { share_amount: number }) => sum + Number(s.share_amount), 0) ?? 0
    setMyBalance(totalPaid - totalOwed)

    setLoading(false)
  }

  async function copyInviteLink() {
    if (!trip) return
    const link = `${window.location.origin}/join/${trip.invite_code}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const CATEGORY_ICONS: Record<string, string> = {
    food: '🍜', transport: '🚗', accommodation: '🏨',
    activity: '🎡', shopping: '🛒', other: '💳',
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  if (!trip) return null

  return (
    <div className="page-container">
      {/* Header */}
      <div className="sticky-header" style={{ padding: '1rem 1rem 0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <Link href="/trips" className="btn btn-ghost btn-icon" id="btn-back">
            <ArrowLeft size={20} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '1rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {trip.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`badge ${trip.status === 'active' ? 'badge-active' : 'badge-settled'}`}>
                {trip.status === 'active' ? '● Aktif' : '✓ Selesai'}
              </span>
              {trip.start_date && (
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  {format(new Date(trip.start_date), 'd MMM', { locale: localeId })}
                  {trip.end_date && ` — ${format(new Date(trip.end_date), 'd MMM yyyy', { locale: localeId })}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', animation: 'fadeInUp 0.3s ease' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.05))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Trip
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {formatRupiah(totalExpense)}
            </div>
          </div>
          <div className={`card`} style={{ background: myBalance >= 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(20,184,166,0.05))' : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.05))', border: `1px solid ${myBalance >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Saldo Kamu
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: myBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {myBalance >= 0 ? '+' : ''}{formatRupiah(myBalance)}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem', animation: 'fadeInUp 0.3s ease' }}>
          {[
            { href: `/trips/${tripId}/expenses/new`, icon: '➕', label: 'Tambah', id: 'action-add-expense', color: 'var(--color-primary)' },
            { href: `/trips/${tripId}/balance`, icon: '⚖️', label: 'Saldo', id: 'action-balance', color: 'var(--color-accent)' },
            { href: `/trips/${tripId}/history`, icon: '📋', label: 'Riwayat', id: 'action-history', color: '#8b5cf6' },
            { href: `/trips/${tripId}/settle`, icon: '✅', label: 'Settle', id: 'action-settle', color: 'var(--color-success)' },
          ].map(action => (
            <Link
              key={action.id}
              href={action.href}
              id={action.id}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = action.color
                  ;(e.currentTarget as HTMLElement).style.background = `${action.color}15`
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--color-bg-elevated)'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{action.icon}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{action.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Invite Link */}
        <div className="card" style={{ marginBottom: '1.25rem', animation: 'fadeInUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
              <Share2 size={16} style={{ color: 'var(--color-primary)' }} />
              Invite Anggota
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{
              flex: 1,
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '0.6rem 0.875rem',
              fontSize: '0.78rem',
              color: 'var(--color-text-muted)',
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {typeof window !== 'undefined' ? `${window.location.origin}/join/${trip.invite_code}` : `/join/${trip.invite_code}`}
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={copyInviteLink}
              id="btn-copy-invite"
              style={{ flexShrink: 0 }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Tersalin!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="card" style={{ marginBottom: '1.25rem', animation: 'fadeInUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
              <Users size={16} style={{ color: 'var(--color-accent)' }} />
              Anggota ({members.length})
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {members.map(member => (
              <div key={member.user_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                <Avatar profile={member.profile} size="md" />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', maxWidth: '56px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {member.profile?.name || 'User'}
                </span>
                {member.role === 'admin' && (
                  <span className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>admin</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={16} style={{ color: '#8b5cf6' }} />
              Pengeluaran Terbaru
            </h2>
            <Link href={`/trips/${tripId}/history`} style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
              Lihat semua →
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💸</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Belum ada pengeluaran</p>
              <Link href={`/trips/${tripId}/expenses/new`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none', marginTop: '0.75rem', display: 'inline-flex' }} id="btn-add-first-expense">
                <Plus size={14} /> Tambah Expense
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentExpenses.map(exp => (
                <Link key={exp.id} href={`/trips/${tripId}/expenses/${exp.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '0.875rem', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'var(--color-bg-input)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', flexShrink: 0,
                      }}>
                        {CATEGORY_ICONS[exp.category] || '💳'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exp.description}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Dibayar {(exp as any).payer?.name || 'Unknown'} · {format(new Date(exp.date), 'd MMM', { locale: localeId })}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)', flexShrink: 0 }}>
                        {formatRupiah(Number(exp.amount))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Settle Trip (Visible to everyone for transparency) */}
        {trip.status === 'active' && (
          <div style={{ marginTop: '1.5rem', animation: 'fadeInUp 0.3s ease' }}>
            <Link href={`/trips/${tripId}/settle`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(20,184,166,0.06))',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                cursor: 'pointer',
              }}>
                <CheckCircle2 size={24} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{isAdmin ? 'Selesaikan Trip' : 'Rincian Patungan'}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{isAdmin ? 'Kelarin semua utang dan tutup trip ini' : 'Lihat siapa yang harus bayar ke siapa'}</div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--color-text-muted)', marginLeft: 'auto' }} />
              </div>
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
