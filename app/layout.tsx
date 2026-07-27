import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/app-shell'
import { ThemeProvider } from '@/components/shared/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reference - Private Knowledge & CRM',
  description: 'A private system for capturing and rediscovering useful knowledge',
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
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
