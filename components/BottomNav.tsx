'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, PlusCircle, User } from 'lucide-react'
import Link from 'next/link'

interface BottomNavProps {
  tripId?: string
}

export default function BottomNav({ tripId }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: '/trips', label: 'Trips', icon: Home },
    { href: '/profile', label: 'Profil', icon: User },
  ]

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-items">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              id={`nav-${item.label.toLowerCase()}`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
