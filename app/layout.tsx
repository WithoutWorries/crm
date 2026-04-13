import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { ThemeProvider } from '@/components/shared/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'SoloCRM - Engineering Consultant CRM',
  description: 'A powerful CRM for freelance engineering consultants',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <Sidebar />
          <TopBar />
          <main className="ml-60 pt-16 pb-8 px-8 min-h-screen bg-slate-50 dark:bg-fmea-bg">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
