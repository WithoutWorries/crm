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
      <main className="min-h-screen bg-[#f7f6f2] px-4 pb-12 pt-8 dark:bg-fmea-bg sm:px-6 md:ml-60 md:px-8 md:pt-10">
        {children}
      </main>
    </>
  )
}
