'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { InactivityTimer } from '@/components/layout/inactivity-timer'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <>
      <InactivityTimer />
      <Sidebar />
      <TopBar />
      <main className="ml-60 pt-16 pb-8 px-8 min-h-screen bg-slate-50 dark:bg-fmea-bg">
        {children}
      </main>
    </>
  )
}
