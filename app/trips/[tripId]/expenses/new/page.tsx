'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, ExpenseCategory, SplitType, CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/types'
import { calculateSplits, validateSplits, SplitInput } from '@/lib/split-calculator'
import { parseRupiah } from '@/lib/debt-simplifier'
import { ArrowLeft, Loader2, ChevronDown, Check } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'food', label: 'Makan & Minum', icon: '🍜' },
  { value: 'transport', label: 'Transportasi', icon: '🚗' },
  { value: 'accommodation', label: 'Akomodasi', icon: '🏨' },
  { value: 'activity', label: 'Aktivitas', icon: '🎡' },
  { value: 'shopping', label: 'Belanja', icon: '🛒' },
  { value: 'other', label: 'Lainnya', icon: '💳' },
]

export default function NewExpensePage() {
  const params = useParams()
  const tripId = params.tripId as string
  const router = useRouter()
  const supabase = createClient()

  const [members, setMembers] = useState<Profile[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [description, setDescription] = useState('')
  const [rawAmount, setRawAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [splitType, setSplitType] = useState<SplitType>('equal')

  // Split state
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [percentages, setPercentages] = useState<Record<string, string>>({})
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)
    setPaidBy(user.id)

    const { data: membersData } = await supabase
      .from('trip_members')
      .select('*, profile:profiles(*)')
      .eq('trip_id', tripId)

    const profiles = membersData?.map((m: any) => m.profile).filter(Boolean) || []
    setMembers(profiles)

    // Select all members by default for equal split
    setSelectedMembers(new Set(profiles.map((p: Profile) => p.id)))
    setLoading(false)
  }

  const amount = parseRupiah(rawAmount)

  const toggleMember = (userId: string) => {
    const next = new Set(selectedMembers)
    if (next.has(userId)) {
      next.delete(userId)
    } else {
      next.add(userId)
    }
    setSelectedMembers(next)
  }

  function formatAmountInput(val: string) {
    const digits = val.replace(/\D/g, '')
    if (!digits) return ''
    return new Intl.NumberFormat('id-ID').format(parseInt(digits, 10))
  }

  const getSplitInputs = (): SplitInput[] => {
    return Array.from(selectedMembers).map(userId => ({
      userId,
      percentage: splitType === 'percentage' ? (parseFloat(percentages[userId] || '0')) : undefined,
      exactAmount: splitType === 'exact' ? parseRupiah(exactAmounts[userId] || '0') : undefined,
    }))
  }

  const totalPercentage = Array.from(selectedMembers).reduce(
    (sum, uid) => sum + parseFloat(percentages[uid] || '0'), 0
  )

  const totalExact = Array.from(selectedMembers).reduce(
    (sum, uid) => sum + parseRupiah(exactAmounts[uid] || '0'), 0
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || amount <= 0 || !paidBy) {
      setError('Isi deskripsi, nominal, dan siapa yang bayar')
      return
    }
    if (selectedMembers.size === 0) {
      setError('Pilih minimal 1 anggota untuk split')
      return
    }

    const splitInputs = getSplitInputs()
    const validationError = validateSplits(amount, splitType, splitInputs)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const splits = calculateSplits(amount, splitType, splitInputs)

      // Insert expense
      const { data: expense, error: expErr } = await supabase
        .from('expenses')
        .insert({
          trip_id: tripId,
          description: description.trim(),
          amount,
          paid_by: paidBy,
          category,
          date,
          notes: notes.trim() || null,
        })
        .select()
        .single()

      if (expErr) throw expErr

      // Insert splits
      const splitsToInsert = splits.map(s => ({
        expense_id: expense.id,
        user_id: s.userId,
        share_amount: s.shareAmount,
        share_type: s.shareType,
        share_percentage: s.sharePercentage,
      }))

      const { error: splitErr } = await supabase
        .from('expense_splits')
        .insert(splitsToInsert)

      if (splitErr) throw splitErr

      router.push(`/trips/${tripId}`)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', maxWidth: '480px', margin: '0 auto' }}>
      {/* Header */}
      <div className="sticky-header" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <Link href={`/trips/${tripId}`} className="btn btn-ghost btn-icon" id="btn-back">
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Tambah Pengeluaran</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Description */}
        <div className="form-group">
          <label className="input-label" htmlFor="expense-desc">
            Keterangan <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            id="expense-desc"
            type="text"
            className="input"
            placeholder="cth: Makan siang di warung padang"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            autoFocus
            maxLength={200}
          />
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="input-label" htmlFor="expense-amount">
            Nominal (Rp) <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.9rem',
            }}>Rp</span>
            <input
              id="expense-amount"
              type="text"
              inputMode="numeric"
              className="input"
              placeholder="0"
              value={rawAmount}
              onChange={e => setRawAmount(formatAmountInput(e.target.value))}
              required
              style={{ paddingLeft: '2.5rem', fontSize: '1.1rem', fontWeight: 700 }}
            />
          </div>
          {amount > 0 && (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)}
            </div>
          )}
        </div>

        {/* Paid By */}
        <div className="form-group">
          <label className="input-label" htmlFor="paid-by">
            Dibayar oleh <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <select
            id="paid-by"
            className="input"
            value={paidBy}
            onChange={e => setPaidBy(e.target.value)}
            required
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} {m.id === currentUserId ? '(Kamu)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Category & Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="input-label" htmlFor="category">Kategori</label>
            <select
              id="category"
              className="input"
              value={category}
              onChange={e => setCategory(e.target.value as ExpenseCategory)}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="input-label" htmlFor="expense-date">Tanggal</label>
            <input
              id="expense-date"
              type="date"
              className="input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Split Type */}
        <div className="form-group">
          <label className="input-label">Cara Split</label>
          <div className="segment-control">
            {(['equal', 'percentage', 'exact'] as SplitType[]).map(type => (
              <button
                key={type}
                type="button"
                className={`segment-btn ${splitType === type ? 'active' : ''}`}
                onClick={() => setSplitType(type)}
                id={`split-type-${type}`}
              >
                {type === 'equal' ? '⚖️ Rata' : type === 'percentage' ? '% Persen' : '✏️ Nominal'}
              </button>
            ))}
          </div>
        </div>

        {/* Member Selection */}
        <div className="form-group">
          <label className="input-label">
            Dibagi ke ({selectedMembers.size} anggota)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Select all */}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'flex-start', fontSize: '0.78rem' }}
              onClick={() => {
                if (selectedMembers.size === members.length) {
                  setSelectedMembers(new Set())
                } else {
                  setSelectedMembers(new Set(members.map(m => m.id)))
                }
              }}
              id="btn-select-all"
            >
              {selectedMembers.size === members.length ? 'Batalkan semua' : 'Pilih semua'}
            </button>

            {members.map(member => {
              const isSelected = selectedMembers.has(member.id)
              return (
                <div
                  key={member.id}
                  className={`checkbox-item ${isSelected ? 'checked' : ''}`}
                  onClick={() => toggleMember(member.id)}
                  id={`member-${member.id}`}
                >
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '6px',
                    border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: isSelected ? 'var(--color-primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease', flexShrink: 0,
                  }}>
                    {isSelected && <Check size={12} color="black" strokeWidth={3} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {member.name} {member.id === currentUserId ? <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Kamu)</span> : ''}
                    </div>
                    {/* Percentage input */}
                    {isSelected && splitType === 'percentage' && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }} onClick={e => e.stopPropagation()}>
                        <input
                          type="number"
                          className="input"
                          style={{ width: '80px', padding: '0.375rem 0.5rem', fontSize: '0.85rem' }}
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.1"
                          value={percentages[member.id] || ''}
                          onChange={e => setPercentages(prev => ({ ...prev, [member.id]: e.target.value }))}
                          id={`pct-${member.id}`}
                        />
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>%</span>
                      </div>
                    )}
                    {/* Exact amount input */}
                    {isSelected && splitType === 'exact' && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }} onClick={e => e.stopPropagation()}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="input"
                          style={{ flex: 1, padding: '0.375rem 0.5rem', fontSize: '0.85rem' }}
                          placeholder="0"
                          value={exactAmounts[member.id] || ''}
                          onChange={e => setExactAmounts(prev => ({
                            ...prev,
                            [member.id]: formatAmountInput(e.target.value),
                          }))}
                          id={`exact-${member.id}`}
                        />
                      </div>
                    )}
                  </div>
                  {/* Equal split preview */}
                  {isSelected && splitType === 'equal' && amount > 0 && selectedMembers.size > 0 && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                      Rp {Math.floor(amount / selectedMembers.size).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Validation hints */}
          {splitType === 'percentage' && selectedMembers.size > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: Math.abs(totalPercentage - 100) < 0.01 ? 'var(--color-success)' : 'var(--color-warning)' }}>
              Total: {totalPercentage.toFixed(1)}% {Math.abs(totalPercentage - 100) < 0.01 ? '✓' : `(kurang ${(100 - totalPercentage).toFixed(1)}%)`}
            </div>
          )}
          {splitType === 'exact' && amount > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: Math.abs(totalExact - amount) < 2 ? 'var(--color-success)' : 'var(--color-warning)' }}>
              Total: Rp {totalExact.toLocaleString('id-ID')} / Rp {amount.toLocaleString('id-ID')} {Math.abs(totalExact - amount) < 2 ? '✓' : ''}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="input-label" htmlFor="expense-notes">Catatan (opsional)</label>
          <input
            id="expense-notes"
            type="text"
            className="input"
            placeholder="cth: termasuk tip, split tidak termasuk si X..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={300}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={submitting || !description.trim() || amount <= 0 || selectedMembers.size === 0}
          id="btn-submit-expense"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : '💸'}
          {submitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
        </button>
      </form>
    </div>
  )
}
