'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock, LogOut, Shield } from 'lucide-react'
import { NAVIGATION_SECTIONS } from '@/components/layout/navigation'
import { cn } from '@/lib/utils'

interface Me {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'MEMBER'
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
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
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 hidden h-screen flex-col bg-fmea-nav text-white transition-[width] duration-200 md:flex',
        collapsed ? 'w-20' : 'w-60'
      )}
      aria-label="Primary navigation"
    >
      <div
        className={cn(
          'relative flex min-h-[6.5rem] items-center border-b border-fmea-border',
          collapsed ? 'justify-center px-3' : 'px-5'
        )}
      >
        <Link
          href="/knowledge"
          className={cn('flex min-w-0 items-center', collapsed ? 'justify-center' : 'gap-3')}
          title={collapsed ? 'Reference' : undefined}
        >
          <Image
            src="/reference-icon.png"
            alt=""
            width={42}
            height={42}
            className="h-10 w-10 shrink-0 rounded-xl"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-fmea-hi">Reference</p>
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.08em] text-fmea-dim">
                Consulting workspace
              </p>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={onToggle}
          className="absolute -right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-fmea-border2 bg-fmea-bg2 text-fmea-dim shadow-md transition hover:border-fmea-accent hover:text-fmea-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fmea-accent focus-visible:ring-offset-2 focus-visible:ring-offset-fmea-nav"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className={cn('flex-1 overflow-y-auto py-5', collapsed ? 'px-2' : 'px-3')}>
        <div className="space-y-6">
          {NAVIGATION_SECTIONS.map((section) => (
            <section
              key={section.label}
              aria-label={section.label}
              className={cn(collapsed && 'border-t border-fmea-border pt-4 first:border-t-0 first:pt-0')}
            >
              {!collapsed && (
                <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-fmea-dim">
                  {section.label}
                </h2>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname.startsWith(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? `${section.label}: ${item.label}` : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      className={cn(
                        'flex min-h-10 items-center rounded-lg text-sm font-medium transition-colors',
                        collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                        isActive
                          ? 'bg-fmea-accent text-fmea-bg'
                          : 'text-fmea-dim hover:bg-fmea-bg3 hover:text-fmea-text'
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}

          {me?.role === 'ADMIN' && (
            <section
              aria-label="Admin"
              className={cn('border-t border-fmea-border pt-4', collapsed ? '' : 'mt-2')}
            >
              {!collapsed && (
                <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-fmea-dim">
                  Admin
                </h2>
              )}
              <div className="space-y-1">
                <Link
                  href="/admin/users"
                  title={collapsed ? 'Admin: Team users' : undefined}
                  aria-label={collapsed ? 'Team users' : undefined}
                  className={cn(
                    'flex min-h-10 items-center rounded-lg text-sm font-medium transition-colors',
                    collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                    pathname.startsWith('/admin/users')
                      ? 'bg-violet-600 text-white'
                      : 'text-fmea-dim hover:bg-fmea-bg3 hover:text-fmea-text'
                  )}
                >
                  <Shield className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>Team Users</span>}
                </Link>
                <Link
                  href="/admin/login-history"
                  title={collapsed ? 'Admin: Login history' : undefined}
                  aria-label={collapsed ? 'Login history' : undefined}
                  className={cn(
                    'flex min-h-10 items-center rounded-lg text-sm font-medium transition-colors',
                    collapsed ? 'justify-center px-2' : 'gap-3 px-3',
                    pathname.startsWith('/admin/login-history')
                      ? 'bg-violet-600 text-white'
                      : 'text-fmea-dim hover:bg-fmea-bg3 hover:text-fmea-text'
                  )}
                >
                  <Clock className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>Login History</span>}
                </Link>
              </div>
            </section>
          )}
        </div>
      </nav>

      <div className={cn('border-t border-fmea-border py-4', collapsed ? 'px-2' : 'px-3')}>
        <div className={cn('flex items-center py-1', collapsed ? 'justify-center' : 'gap-3 px-2')}>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fmea-accent text-sm font-bold text-fmea-bg"
            title={collapsed ? displayName : undefined}
          >
            {displayName[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fmea-text">{displayName}</p>
              <p className="truncate text-[10px] text-fmea-dim">
                {me?.role === 'ADMIN' ? 'Admin' : 'Member'}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          aria-label={collapsed ? 'Sign out' : undefined}
          className={cn(
            'mt-2 flex min-h-10 w-full items-center rounded-lg text-sm font-medium text-fmea-dim transition-colors hover:bg-fmea-bg3 hover:text-fmea-text',
            collapsed ? 'justify-center px-2' : 'gap-2 px-3'
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
