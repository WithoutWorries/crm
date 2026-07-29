import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/app-shell'
import { ThemeProvider } from '@/components/shared/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reference - Private Consulting Workspace',
  description: 'A private workspace for useful knowledge, enquiries, decisions, and analysis',
  icons: {
    icon: '/reference-icon.png',
    apple: '/reference-icon.png',
  },
  manifest: '/manifest.webmanifest',
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
