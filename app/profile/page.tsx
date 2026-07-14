'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { Loader2, User, Mail, Save, LogOut, Edit2 } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import Avatar from '@/components/Avatar'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      setName(data.name)
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')

    const { error: saveError } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', profile!.id)

    if (saveError) {
      setError(saveError.message)
    } else {
      setProfile(prev => prev ? { ...prev, name: name.trim() } : prev)
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
    </div>
  )

  return (
    <div className="page-container">
      <div className="sticky-header" style={{ padding: '1rem' }}>
        <h1 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Profil</h1>
      </div>

      <div className="page-content">
        {/* Avatar Section */}
        <div style={{ textAlign: 'center', padding: '2rem 0 1.5rem', animation: 'fadeInUp 0.3s ease' }}>
          <Avatar name={profile?.name || '?'} size="xl" className="" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.875rem', marginBottom: '0.25rem' }}>
            {profile?.name || 'Traveler'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            <Mail size={14} />
            {profile?.email || '—'}
          </div>
        </div>

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
            ✓ Profil berhasil diperbarui!
          </div>
        )}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Edit Form */}
        <div className="card" style={{ marginBottom: '1rem', animation: 'fadeInUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} style={{ color: 'var(--color-primary)' }} />
              Informasi Akun
            </h3>
            {!editing && (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)} id="btn-edit-profile">
                <Edit2 size={14} /> Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="input-label" htmlFor="profile-name">Nama Tampilan</label>
                <input
                  id="profile-name"
                  type="text"
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  maxLength={80}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={profile?.email || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Email tidak bisa diubah</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => { setEditing(false); setName(profile?.name || '') }}
                  id="btn-cancel-edit"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={saving || !name.trim()}
                  id="btn-save-profile"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>Nama</div>
                <div style={{ fontWeight: 600 }}>{profile?.name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>Email</div>
                <div style={{ fontWeight: 600 }}>{profile?.email || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>Bergabung sejak</div>
                <div style={{ fontWeight: 600 }}>
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* App Info */}
        <div className="card" style={{ marginBottom: '1rem', animation: 'fadeInUp 0.3s ease' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem' }}>Tentang UrunanKuy</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Versi</span>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>1.0.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Made by</span>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Fariz Albab</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Stack</span>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Next.js + Supabase</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          className="btn btn-danger"
          style={{ width: '100%' }}
          onClick={handleLogout}
          id="btn-logout-profile"
        >
          <LogOut size={16} />
          Keluar dari Akun
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
