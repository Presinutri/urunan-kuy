'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NetBalance, DebtTransaction } from '@/lib/types'
import { simplifyDebts, formatRupiah } from '@/lib/debt-simplifier'
import { ArrowLeft, Loader2, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import Modal from '@/components/Modal'

export default function SettlePage() {
  const params = useParams()
  const tripId = params.tripId as string
  const supabase = createClient()
  const router = useRouter()

  const [transactions, setTransactions] = useState<DebtTransaction[]>([])
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    loadData()
  }, [tripId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    const { data: tripData } = await supabase.from('trips').select('*').eq('id', tripId).single()
    setTrip(tripData)

    const { data: memberData } = await supabase
      .from('trip_members')
      .select('user_id, role, profile:profiles(id, name, avatar_url)')
      .eq('trip_id', tripId)

    const me = memberData?.find(m => m.user_id === user.id)
    setIsAdmin(me?.role === 'admin')

    // Calculate balances same as balance page
    const { data: expenses } = await supabase.from('expenses').select('amount, paid_by').eq('trip_id', tripId)
    const { data: splits } = await supabase
      .from('expense_splits')
      .select('user_id, share_amount, expense:expenses!inner(trip_id)')
      .eq('expense.trip_id', tripId)
    const { data: settlements } = await supabase.from('settlements').select('from_user, to_user, amount').eq('trip_id', tripId)

    const balanceMap: Record<string, number> = {}
    memberData?.forEach(m => { balanceMap[m.user_id] = 0 })
    expenses?.forEach(e => { if (balanceMap[e.paid_by] !== undefined) balanceMap[e.paid_by] += Number(e.amount) })
    splits?.forEach((s: any) => { if (balanceMap[s.user_id] !== undefined) balanceMap[s.user_id] -= Number(s.share_amount) })
    settlements?.forEach(s => {
      if (balanceMap[s.from_user] !== undefined) balanceMap[s.from_user] += Number(s.amount)
      if (balanceMap[s.to_user] !== undefined) balanceMap[s.to_user] -= Number(s.amount)
    })

    const netBalances: NetBalance[] = (memberData || []).map(m => ({
      userId: m.user_id,
      name: (m.profile as any)?.name || 'Unknown',
      avatarUrl: (m.profile as any)?.avatar_url || null,
      balance: Math.round(balanceMap[m.user_id] ?? 0),
    }))

    setTransactions(simplifyDebts(netBalances))
    setLoading(false)
  }

  async function handleSettleAll() {
    setSettling(true)

    // Insert all settlement records
    const settlementsToInsert = transactions.map(tx => ({
      trip_id: tripId,
      from_user: tx.from,
      to_user: tx.to,
      amount: tx.amount,
    }))

    if (settlementsToInsert.length > 0) {
      await supabase.from('settlements').insert(settlementsToInsert)
    }

    // Mark trip as settled
    await supabase.from('trips').update({ status: 'settled' }).eq('id', tripId)

    router.push(`/trips/${tripId}`)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
    </div>
  )

  const isAlreadySettled = trip?.status === 'settled'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', maxWidth: '480px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="sticky-header" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <Link href={`/trips/${tripId}`} className="btn btn-ghost btn-icon" id="btn-back">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Settle Up</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{trip?.name}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        {isAlreadySettled ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Trip sudah selesai!</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Semua utang sudah diselesaikan. Trip ini ditandai selesai.
            </p>
            <Link href={`/trips/${tripId}/history`} className="btn btn-secondary" style={{ textDecoration: 'none', marginTop: '1.5rem', display: 'inline-flex' }} id="btn-view-history">
              Lihat Riwayat Trip
            </Link>
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Semua sudah impas!</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Tidak ada yang perlu bayar siapa-siapa. Bisa langsung tutup trip.
            </p>
            {isAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
                id="btn-close-trip"
              >
                ✅ Tutup Trip
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Info */}
            <div className="alert alert-info" style={{ marginBottom: '1.25rem', animation: 'fadeInUp 0.3s ease' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>
                Algoritma menemukan <strong>{transactions.length} transaksi</strong> yang paling efisien untuk menyelesaikan semua utang trip ini.
              </span>
            </div>

            {/* Transactions */}
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Yang Perlu Dibayar
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem', animation: 'fadeInUp 0.3s ease' }}>
              {transactions.map((tx, i) => {
                const isMyDebt = tx.from === currentUserId
                const isMyReceivable = tx.to === currentUserId
                return (
                  <div
                    key={i}
                    className="card"
                    style={{
                      border: isMyDebt ? '1px solid rgba(239,68,68,0.3)' : isMyReceivable ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--color-border)',
                      background: isMyDebt ? 'rgba(239,68,68,0.04)' : isMyReceivable ? 'rgba(16,185,129,0.04)' : 'var(--color-bg-card)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                        <Avatar name={tx.fromName} size="sm" />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isMyDebt ? <span style={{ color: 'var(--color-danger)' }}>Kamu</span> : tx.fromName}
                          </div>
                          {isMyDebt && <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)' }}>⚠️ Kamu perlu bayar</div>}
                        </div>
                      </div>
                      <ArrowRight size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
                        <div style={{ textAlign: 'right', minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isMyReceivable ? <span style={{ color: 'var(--color-success)' }}>Kamu</span> : tx.toName}
                          </div>
                          {isMyReceivable && <div style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>✓ Kamu menerima</div>}
                        </div>
                        <Avatar name={tx.toName} size="sm" />
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '0.625rem', fontWeight: 900, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                      {formatRupiah(tx.amount)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Settle All Button (admin only) */}
            {isAdmin && (
              <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem' }}>
                    Pastikan semua transfer di atas sudah dilakukan sebelum menekan tombol ini. Aksi ini tidak bisa dibatalkan.
                  </span>
                </div>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  onClick={() => setShowModal(true)}
                  id="btn-settle-all"
                >
                  <CheckCircle2 size={20} />
                  Semua Sudah Bayar — Tutup Trip
                </button>
              </div>
            )}

            {!isAdmin && (
              <div className="alert alert-info" style={{ animation: 'fadeInUp 0.3s ease' }}>
                Hanya admin trip yang bisa menutup trip. Hubungi admin setelah semua pembayaran selesai.
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tutup Trip?">
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Dengan menutup trip <strong style={{ color: 'var(--color-text-primary)' }}>{trip?.name}</strong>, semua hutang akan dicatat sebagai lunas dan trip tidak bisa diubah lagi.<br /><br />
          Pastikan semua transfer sudah dilakukan ya!
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} id="btn-cancel-settle">Batal</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSettleAll} disabled={settling} id="btn-confirm-settle">
            {settling ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {settling ? 'Menutup...' : 'Ya, Tutup Trip'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
