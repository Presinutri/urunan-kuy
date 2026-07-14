'use client'

import { Profile } from '@/lib/types'

interface AvatarProps {
  profile?: Profile | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const AVATAR_COLORS = [
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #14b8a6, #3b82f6)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #10b981, #14b8a6)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
]

function getColor(name: string) {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export default function Avatar({ profile, name, size = 'md', className = '' }: AvatarProps) {
  const displayName = profile?.name || name || '?'
  const initial = displayName.charAt(0).toUpperCase()
  const gradient = getColor(displayName)

  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{ background: gradient }}
      title={displayName}
    >
      {initial}
    </div>
  )
}
