'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { InactivityTimer } from '@/components/layout/inactivity-timer'
import { cn } from '@/lib/utils'

const SIDEBAR_STORAGE_KEY = 'reference-sidebar-collapsed'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true')
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <>
      <InactivityTimer />
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <TopBar sidebarCollapsed={sidebarCollapsed} />
      <main
        className={cn(
          'min-h-screen bg-[#f7f6f2] px-4 pb-12 pt-8 transition-[margin] duration-200 dark:bg-fmea-bg sm:px-6 md:px-8 md:pt-10',
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-60'
        )}
      >
        {children}
      </main>
    </>
  )
}
