'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Kanban,
  Target,
  Users,
  Building2,
  CheckSquare,
  Activity,
  LogOut,
  Shield,
  Zap,
  Clock,
  Briefcase,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Me {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'MEMBER'
}

const navItems = [
  { href: '/knowledge', icon: BookOpen, label: 'Knowledge' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { href: '/opportunities', icon: Target, label: 'Opportunities' },
  { href: '/contacts', icon: Users, label: 'Contacts' },
  { href: '/companies', icon: Building2, label: 'Companies' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/activities', icon: Activity, label: 'Activities' },
  { href: '/procurement', icon: Briefcase, label: 'Procurement' },
  { href: '/quick-capture', icon: Zap, label: 'Enquiry Capture' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => { if (d) setMe(d) })
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const displayName = me?.name || me?.email?.split('@')[0] || '…'

  return (
    <div className="fixed left-0 top-0 hidden h-screen w-60 flex-col bg-fmea-nav text-white md:flex">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-fmea-border">
        <h1 className="text-2xl font-bold text-fmea-hi">Reference</h1>
        <p className="text-xs text-fmea-dim mt-1">Private consulting workspace</p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium',
                isActive
                  ? 'bg-fmea-accent text-fmea-bg'
                  : 'text-fmea-dim hover:bg-fmea-bg3 hover:text-fmea-text'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Admin section — visible to ADMIN role only */}
        {me?.role === 'ADMIN' && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-4 text-[10px] font-semibold text-fmea-dim uppercase tracking-widest">Admin</p>
            </div>
            <Link
              href="/admin/users"
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium',
                pathname.startsWith('/admin/users')
                  ? 'bg-violet-600 text-white'
                  : 'text-fmea-dim hover:bg-fmea-bg3 hover:text-fmea-text'
              )}
            >
              <Shield className="h-4 w-4" />
              <span>Team Users</span>
            </Link>
            <Link
              href="/admin/login-history"
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium',
                pathname.startsWith('/admin/login-history')
                  ? 'bg-violet-600 text-white'
                  : 'text-fmea-dim hover:bg-fmea-bg3 hover:text-fmea-text'
              )}
            >
              <Clock className="h-4 w-4" />
              <span>Login History</span>
            </Link>
          </>
        )}
      </nav>

      {/* Footer: user identity + sign out */}
      <div className="px-4 py-4 border-t border-fmea-border space-y-2">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="h-8 w-8 rounded-full bg-fmea-accent flex items-center justify-center text-fmea-bg text-sm font-bold shrink-0">
            {displayName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-fmea-text truncate">{displayName}</p>
            <p className="text-[10px] text-fmea-dim truncate">{me?.role === 'ADMIN' ? '⬡ Admin' : 'Member'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-fmea-dim hover:bg-fmea-bg3 hover:text-fmea-text transition-colors text-sm font-medium"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
        <p className="text-[10px] text-fmea-dim px-2">Private workspace</p>
      </div>
    </div>
  )
}
