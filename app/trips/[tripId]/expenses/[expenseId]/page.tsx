'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Expense, ExpenseSplit, Profile, CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/types'
import { formatRupiah } from '@/lib/debt-simplifier'
import { ArrowLeft, Trash2, Loader2, Users } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import Modal from '@/components/Modal'
import Avatar from '@/components/Avatar'

export default function ExpenseDetailPage() {
  const params = useParams()
  const tripId = params.tripId as string
  const expenseId = params.expenseId as string
  const router = useRouter()
  const supabase = createClient()

  const [expense, setExpense] = useState<any>(null)
  const [splits, setSplits] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [expenseId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    const { data: expData } = await supabase
      .from('expenses')
      .select('*, payer:profiles!paid_by(*)')
      .eq('id', expenseId)
      .single()

    if (!expData) { router.push(`/trips/${tripId}`); return }
    setExpense(expData)

    const { data: splitsData } = await supabase
      .from('expense_splits')
      .select('*, profile:profiles(*)')
      .eq('expense_id', expenseId)

    setSplits(splitsData || [])
    setLoading(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('expense_splits').delete().eq('expense_id', expenseId)
    await supabase.from('expenses').delete().eq('id', expenseId)
    router.push(`/trips/${tripId}`)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
    </div>
  )

  const canDelete = expense?.paid_by === currentUserId

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', maxWidth: '480px', margin: '0 auto' }}>
      <div className="sticky-header" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <Link href={`/trips/${tripId}`} className="btn btn-ghost btn-icon" id="btn-back">
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Detail Pengeluaran</h1>
        </div>
        {canDelete && (
          <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)} id="btn-delete-expense">
            <Trash2 size={14} /> Hapus
          </button>
        )}
      </div>

      <div style={{ padding: '1rem' }}>
        {/* Main Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.05))',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '20px',
          padding: '1.5rem',
          textAlign: 'center',
          marginBottom: '1.25rem',
          animation: 'fadeInUp 0.3s ease',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            {CATEGORY_ICONS[expense.category as keyof typeof CATEGORY_ICONS] || '💳'}
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{expense.description}</h2>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            {formatRupiah(Number(expense.amount))}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {CATEGORY_LABELS[expense.category as keyof typeof CATEGORY_LABELS]} ·{' '}
            {format(new Date(expense.date), 'd MMMM yyyy', { locale: localeId })}
          </div>
        </div>

        {/* Paid by */}
        <div className="card" style={{ marginBottom: '1rem', animation: 'fadeInUp 0.3s ease' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Dibayar oleh
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Avatar profile={expense.payer} size="md" />
            <div>
              <div style={{ fontWeight: 700 }}>{expense.payer?.name || 'Unknown'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>
                +{formatRupiah(Number(expense.amount))}
              </div>
            </div>
          </div>
        </div>

        {/* Splits */}
        <div className="card" style={{ animation: 'fadeInUp 0.3s ease' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Users size={14} /> Dibagi ke ({splits.length} orang)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {splits.map(split => (
              <div key={split.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Avatar profile={split.profile} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{split.profile?.name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    {split.share_type === 'equal' ? 'Rata' : split.share_type === 'percentage' ? `${split.share_percentage}%` : 'Nominal'}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                  -{formatRupiah(Number(split.share_amount))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {expense.notes && (
          <div className="card" style={{ marginTop: '1rem', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Catatan
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{expense.notes}</p>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Hapus Pengeluaran?">
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Yakin mau hapus <strong style={{ color: 'var(--color-text-primary)' }}>{expense?.description}</strong>? Semua data split akan ikut terhapus dan tidak bisa dikembalikan.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)} id="btn-cancel-delete">Batal</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete} disabled={deleting} id="btn-confirm-delete">
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {deleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
