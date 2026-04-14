import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/app-shell'
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
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
