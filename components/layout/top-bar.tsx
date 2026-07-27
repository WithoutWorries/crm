'use client'

import { useState } from 'react'
import {
  Activity,
  BookOpen,
  Briefcase,
  Building2,
  CheckSquare,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/shared/theme-provider'
import { NotificationBell } from '@/components/layout/notification-bell'
import { cn } from '@/lib/utils'

export function TopBar() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const isKnowledge = pathname.startsWith('/knowledge')

  const quickAddOptions = [
    { icon: BookOpen, label: 'Capture knowledge', href: '/knowledge#capture' },
    { icon: Building2, label: 'New company', href: '/companies/new' },
    { icon: Users, label: 'New contact', href: '/contacts/new' },
    { icon: Target, label: 'New opportunity', href: '/opportunities/new' },
    { icon: CheckSquare, label: 'New task', href: '/tasks/new' },
  ]

  const mobileNav = [
    { icon: BookOpen, label: 'Knowledge', href: '/knowledge' },
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Search, label: 'Pipeline', href: '/pipeline' },
    { icon: Target, label: 'Opportunities', href: '/opportunities' },
    { icon: Users, label: 'Contacts', href: '/contacts' },
    { icon: Building2, label: 'Companies', href: '/companies' },
    { icon: CheckSquare, label: 'Tasks', href: '/tasks' },
    { icon: Activity, label: 'Activities', href: '/activities' },
    { icon: Briefcase, label: 'Procurement', href: '/procurement' },
    { icon: Zap, label: 'CRM Capture', href: '/quick-capture' },
  ]

  return (
    <div className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur dark:border-fmea-border dark:bg-fmea-nav/95 md:ml-60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-3 md:flex-1">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-slate-600 hover:bg-stone-100 dark:text-fmea-dim dark:hover:bg-fmea-bg3 md:hidden"
            aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/knowledge" className="text-base font-bold tracking-tight text-slate-900 dark:text-fmea-hi md:hidden">
            Reference
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-fmea-dim hover:bg-slate-100 dark:hover:bg-fmea-bg3 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Team activity belongs to the CRM, not the private knowledge space. */}
          {!isKnowledge && <NotificationBell />}

          {/* Quick Add Button */}
          {!isKnowledge && <div className="relative">
            <button
              onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Quick Add</span>
              <span className="sm:hidden">Add</span>
            </button>

            {isQuickAddOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsQuickAddOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-fmea-bg2 rounded-lg shadow-lg border border-slate-200 dark:border-fmea-border overflow-hidden z-50">
                  {quickAddOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <Link
                        key={option.label}
                        href={option.href}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-900 dark:text-fmea-text hover:bg-slate-50 dark:hover:bg-fmea-bg3 transition-colors"
                        onClick={() => setIsQuickAddOpen(false)}
                      >
                        <Icon className="h-5 w-5 text-slate-500 dark:text-fmea-dim" />
                        <span>{option.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}
          </div>}
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav className="border-t border-stone-200 bg-white px-3 py-3 dark:border-fmea-border dark:bg-fmea-nav md:hidden">
          <div className="grid grid-cols-2 gap-1">
            {mobileNav.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium',
                    active
                      ? 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-fmea-accent'
                      : 'text-slate-600 hover:bg-stone-100 dark:text-fmea-dim dark:hover:bg-fmea-bg3'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
