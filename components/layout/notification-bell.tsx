'use client'

import { useState, useEffect, useRef, type FC } from 'react'
import { Bell, Building2, Users, Target, Activity } from 'lucide-react'

interface AuditEntry {
  id: string
  action: string
  entity: string
  entityId: string
  entityName: string | null
  createdAt: string
  user: { name: string | null; email: string }
}

interface NotificationsData {
  unreadCount: number
  recent: AuditEntry[]
}

const ENTITY_ICON: Record<string, FC<{ className?: string }>> = {
  Contact: Users,
  Company: Building2,
  Opportunity: Target,
  Activity: Activity,
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'text-emerald-600 dark:text-emerald-400',
  UPDATE: 'text-indigo-600 dark:text-indigo-400',
  DELETE: 'text-rose-600 dark:text-rose-400',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationBell() {
  const [data, setData] = useState<NotificationsData | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchData = async () => {
    const res = await fetch('/api/notifications')
    if (res.ok) setData(await res.json())
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = async () => {
    setOpen((o) => !o)
    if (!open && data && data.unreadCount > 0) {
      await fetch('/api/notifications', { method: 'POST' })
      setData((d) => d ? { ...d, unreadCount: 0 } : d)
    }
  }

  const unread = data?.unreadCount ?? 0

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-slate-500 dark:text-fmea-dim hover:bg-slate-100 dark:hover:bg-fmea-bg3 transition-colors"
        title="Team activity"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-fmea-bg2 rounded-xl shadow-xl border border-slate-200 dark:border-fmea-border overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-fmea-border">
            <p className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">Team Activity</p>
            <p className="text-xs text-slate-500 dark:text-fmea-dim mt-0.5">Changes made by teammates</p>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-fmea-border">
            {!data || data.recent.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">No team activity yet</div>
            ) : (
              data.recent.map((entry) => {
                const Icon = ENTITY_ICON[entry.entity] ?? Activity
                const actionColor = ACTION_COLOR[entry.action] ?? 'text-slate-500'
                const userName = entry.user.name || entry.user.email.split('@')[0]
                return (
                  <div key={entry.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-fmea-bg3 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-500 dark:text-fmea-dim shrink-0">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-900 dark:text-fmea-text leading-snug">
                          <span className="font-semibold">{userName}</span>
                          {' '}
                          <span className={`font-medium ${actionColor}`}>{entry.action.toLowerCase()}d</span>
                          {' '}
                          <span className="font-medium">{entry.entity}</span>
                          {entry.entityName && <span className="text-slate-500 dark:text-fmea-dim"> · {entry.entityName}</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-fmea-dim mt-0.5">{timeAgo(entry.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
