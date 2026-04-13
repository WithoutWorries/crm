'use client'

import { useState } from 'react'
import { Plus, Building2, Users, Target, CheckSquare, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/components/shared/theme-provider'

export function TopBar() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const quickAddOptions = [
    { icon: Building2, label: 'New Company', href: '/companies?action=new' },
    { icon: Users, label: 'New Contact', href: '/contacts?action=new' },
    { icon: Target, label: 'New Opportunity', href: '/opportunities?action=new' },
    { icon: CheckSquare, label: 'New Task', href: '/tasks?action=new' },
  ]

  return (
    <div className="ml-60 border-b border-slate-200 dark:border-fmea-border bg-white dark:bg-fmea-nav sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-8">
        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-fmea-dim hover:bg-slate-100 dark:hover:bg-fmea-bg3 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Quick Add Button */}
          <div className="relative">
            <button
              onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Quick Add</span>
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
          </div>
        </div>
      </div>
    </div>
  )
}
