'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Expense, ExpenseCategory, CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/types'
import { formatRupiah } from '@/lib/debt-simplifier'
import { ArrowLeft, Loader2, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: 'all', label: 'Semua', icon: '🧾' },
  { value: 'food', label: 'Makan', icon: '🍜' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'accommodation', label: 'Hotel', icon: '🏨' },
  { value: 'activity', label: 'Aktivitas', icon: '🎡' },
  { value: 'shopping', label: 'Belanja', icon: '🛒' },
  { value: 'other', label: 'Lainnya', icon: '💳' },
]

export default function HistoryPage() {
  const params = useParams()
  const tripId = params.tripId as string
  const supabase = createClient()

  const [expenses, setExpenses] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tripName, setTripName] = useState('')
  const [totalExpense, setTotalExpense] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => {
    loadData()
  }, [tripId])

  useEffect(() => {
    applyFilters()
  }, [expenses, search, categoryFilter])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)

    const { data: trip } = await supabase.from('trips').select('name').eq('id', tripId).single()
    if (trip) setTripName(trip.name)

    const { data: expData } = await supabase
      .from('expenses')
      .select('*, payer:profiles!paid_by(*), splits:expense_splits(user_id, share_amount, profile:profiles(name))')
      .eq('trip_id', tripId)
      .order('date', { ascending: false })

    setExpenses(expData || [])
    const total = expData?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
    setTotalExpense(total)
    setLoading(false)
  }

  function applyFilters() {
    let result = [...expenses]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(e => e.description.toLowerCase().includes(q) || e.payer?.name?.toLowerCase().includes(q))
    }
    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter)
    }
    setFiltered(result)
  }

  // Group by date
  const grouped: Record<string, any[]> = {}
  filtered.forEach(exp => {
    const dateKey = exp.date
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(exp)
  })
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', maxWidth: '480px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="sticky-header" style={{ padding: '1rem 1rem 0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.875rem' }}>
          <Link href={`/trips/${tripId}`} className="btn btn-ghost btn-icon" id="btn-back">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Riwayat Pengeluaran</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{tripName}</p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '0.625rem' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Cari pengeluaran..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
            id="search-expenses"
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              className={`btn btn-sm ${categoryFilter === cat.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCategoryFilter(cat.value)}
              id={`cat-filter-${cat.value}`}
              style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0.875rem 1rem' }}>
        {/* Summary */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.875rem', background: 'var(--color-bg-elevated)', borderRadius: '12px',
          marginBottom: '1.25rem', border: '1px solid var(--color-border)',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total {filtered.length} pengeluaran
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
              {formatRupiah(filtered.reduce((sum, e) => sum + Number(e.amount), 0))}
            </div>
          </div>
          <Link href={`/trips/${tripId}/expenses/new`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }} id="btn-add-expense">
            + Tambah
          </Link>
        </div>

        {/* Grouped Expenses */}
        {sortedDates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {search || categoryFilter !== 'all' ? 'Tidak ada pengeluaran yang cocok' : 'Belum ada pengeluaran'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeInUp 0.3s ease' }}>
            {sortedDates.map(dateKey => (
              <div key={dateKey}>
                <div style={{
                  fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: '0.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span>{format(new Date(dateKey), 'EEEE, d MMMM yyyy', { locale: localeId })}</span>
                  <span style={{ color: 'var(--color-primary)' }}>
                    {formatRupiah(grouped[dateKey].reduce((sum, e) => sum + Number(e.amount), 0))}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {grouped[dateKey].map(exp => {
                    const myShare = exp.splits?.find((s: any) => s.user_id === currentUserId)
                    return (
                      <Link key={exp.id} href={`/trips/${tripId}/expenses/${exp.id}`} style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ padding: '0.875rem', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '10px',
                              background: 'var(--color-bg-input)', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                            }}>
                              {CATEGORY_ICONS[exp.category as ExpenseCategory] || '💳'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {exp.description}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.15rem' }}>
                                <Avatar profile={exp.payer} size="sm" className="" />
                                {exp.payer?.name || 'Unknown'}
                                {myShare && (
                                  <span style={{ color: exp.paid_by === currentUserId ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                                    · {exp.paid_by === currentUserId ? '+' : '-'}{formatRupiah(Number(myShare.share_amount))} kamu
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary)', flexShrink: 0 }}>
                              {formatRupiah(Number(exp.amount))}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
