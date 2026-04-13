'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { href: '/opportunities', icon: Target, label: 'Opportunities' },
  { href: '/contacts', icon: Users, label: 'Contacts' },
  { href: '/companies', icon: Building2, label: 'Companies' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/activities', icon: Activity, label: 'Activities' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-60 bg-fmea-nav text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-fmea-border">
        <h1 className="text-2xl font-bold text-fmea-hi">SoloCRM</h1>
        <p className="text-xs text-fmea-dim mt-1">Engineering Consultant</p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium',
                isActive
                  ? 'bg-fmea-accent text-fmea-bg'
                  : 'text-fmea-dim hover:bg-fmea-bg3 hover:text-fmea-text'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-fmea-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-fmea-dim hover:bg-fmea-bg3 hover:text-fmea-text transition-colors text-sm font-medium"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
        <p className="text-xs text-fmea-dim mt-3">© 2024 SoloCRM</p>
      </div>
    </div>
  )
}
