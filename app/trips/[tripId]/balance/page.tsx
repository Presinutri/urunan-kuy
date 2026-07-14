'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NetBalance, DebtTransaction } from '@/lib/types'
import { simplifyDebts, formatRupiah } from '@/lib/debt-simplifier'
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'

export default function BalancePage() {
  const params = useParams()
  const tripId = params.tripId as string
  const supabase = createClient()

  const [balances, setBalances] = useState<NetBalance[]>([])
  const [transactions, setTransactions] = useState<DebtTransaction[]>([])
  const [tripName, setTripName] = useState('')
  const [totalExpense, setTotalExpense] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => {
    loadBalance()
  }, [tripId])

  async function loadBalance() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    // Trip info
    const { data: trip } = await supabase.from('trips').select('name').eq('id', tripId).single()
    if (trip) setTripName(trip.name)

    // Members
    const { data: membersData } = await supabase
      .from('trip_members')
      .select('user_id, profile:profiles(id, name, avatar_url)')
      .eq('trip_id', tripId)

    if (!membersData) { setLoading(false); return }

    // All expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id, amount, paid_by')
      .eq('trip_id', tripId)

    // All splits
    const { data: splits } = await supabase
      .from('expense_splits')
      .select('expense_id, user_id, share_amount, expense:expenses!inner(trip_id)')
      .eq('expense.trip_id', tripId)

    // All settlements
    const { data: settlements } = await supabase
      .from('settlements')
      .select('from_user, to_user, amount')
      .eq('trip_id', tripId)

    const total = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
    setTotalExpense(total)

    // Calculate net balance per user
    const balanceMap: Record<string, number> = {}

    // Initialize all members
    membersData.forEach(m => { balanceMap[m.user_id] = 0 })

    // What each person paid (positive)
    expenses?.forEach(exp => {
      if (balanceMap[exp.paid_by] !== undefined) {
        balanceMap[exp.paid_by] += Number(exp.amount)
      }
    })

    // What each person owes (negative)
    splits?.forEach((split: any) => {
      if (balanceMap[split.user_id] !== undefined) {
        balanceMap[split.user_id] -= Number(split.share_amount)
      }
    })

    // Adjust for settlements
    settlements?.forEach(s => {
      if (balanceMap[s.from_user] !== undefined) balanceMap[s.from_user] += Number(s.amount)
      if (balanceMap[s.to_user] !== undefined) balanceMap[s.to_user] -= Number(s.amount)
    })

    // Build NetBalance array
    const netBalances: NetBalance[] = membersData.map(m => ({
      userId: m.user_id,
      name: (m.profile as any)?.name || 'Unknown',
      avatarUrl: (m.profile as any)?.avatar_url || null,
      balance: Math.round(balanceMap[m.user_id] ?? 0),
    }))

    setBalances(netBalances)
    setTransactions(simplifyDebts(netBalances))
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', maxWidth: '480px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="sticky-header" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <Link href={`/trips/${tripId}`} className="btn btn-ghost btn-icon" id="btn-back">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Saldo Trip</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{tripName}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        {/* Total */}
        <div style={{
          textAlign: 'center', padding: '1.25rem', marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.05))',
          border: '1px solid rgba(245,158,11,0.15)', borderRadius: '16px',
          animation: 'fadeInUp 0.3s ease',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
            Total Pengeluaran Trip
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-primary)' }}>
            {formatRupiah(totalExpense)}
          </div>
        </div>

        {/* Net Balance per person */}
        <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          Saldo per Anggota
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', animation: 'fadeInUp 0.3s ease' }}>
          {balances.sort((a, b) => b.balance - a.balance).map(bal => {
            const isMe = bal.userId === currentUserId
            const isPositive = bal.balance > 0
            const isNeutral = Math.abs(bal.balance) < 1
            return (
              <div
                key={bal.userId}
                className="card"
                style={{
                  border: isMe ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--color-border)',
                  background: isMe ? 'rgba(245,158,11,0.04)' : 'var(--color-bg-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <Avatar name={bal.name} size="md" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {bal.name} {isMe && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(Kamu)</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {isNeutral ? 'Sudah impas ✓' : isPositive ? 'Berhak terima' : 'Perlu bayar'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 800, fontSize: '1rem',
                      color: isNeutral ? 'var(--color-text-muted)' : isPositive ? 'var(--color-success)' : 'var(--color-danger)',
                    }}>
                      {isPositive ? '+' : ''}{formatRupiah(bal.balance)}
                    </div>
                    {isNeutral ? <Minus size={14} style={{ color: 'var(--color-text-muted)' }} /> :
                     isPositive ? <TrendingUp size={14} style={{ color: 'var(--color-success)' }} /> :
                     <TrendingDown size={14} style={{ color: 'var(--color-danger)' }} />}
                  </div>
                </div>

                {/* Balance bar */}
                {!isNeutral && (
                  <div style={{ marginTop: '0.75rem', height: '4px', background: 'var(--color-bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, Math.abs(bal.balance) / Math.max(1, totalExpense / balances.length) * 100)}%`,
                      background: isPositive ? 'var(--color-success)' : 'var(--color-danger)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Debt Simplification */}
        {transactions.length > 0 && (
          <>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Cara Settle yang Paling Efisien ({transactions.length} transaksi)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', animation: 'fadeInUp 0.3s ease' }}>
              {transactions.map((tx, i) => {
                const isMyDebt = tx.from === currentUserId
                const isMyReceivable = tx.to === currentUserId
                return (
                  <div
                    key={i}
                    className="card"
                    style={{
                      border: (isMyDebt || isMyReceivable) ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--color-border)',
                      background: isMyDebt ? 'rgba(239,68,68,0.04)' : isMyReceivable ? 'rgba(16,185,129,0.04)' : 'var(--color-bg-card)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar name={tx.fromName} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isMyDebt ? <span style={{ color: 'var(--color-danger)' }}>Kamu</span> : tx.fromName}
                          {' '}bayar{' '}
                          {isMyReceivable ? <span style={{ color: 'var(--color-success)' }}>Kamu</span> : tx.toName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          {isMyDebt ? '⚠️ Kamu perlu bayar ini' : isMyReceivable ? '✓ Kamu menerima ini' : 'Transaksi antar anggota'}
                        </div>
                      </div>
                      <ArrowRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary)', flexShrink: 0 }}>
                        {formatRupiah(tx.amount)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <Link
                href={`/trips/${tripId}/settle`}
                className="btn btn-primary"
                style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}
                id="btn-go-settle"
              >
                ✅ Ke Halaman Settle Up
              </Link>
            </div>
          </>
        )}

        {transactions.length === 0 && balances.length > 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Semua sudah impas!</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Tidak ada yang perlu bayar siapa-siapa.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
