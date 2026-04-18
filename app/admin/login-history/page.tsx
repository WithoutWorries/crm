'use client'

import { useEffect, useState } from 'react'
import { Clock, Monitor, Globe, ChevronLeft, ChevronRight } from 'lucide-react'

interface LoginUser {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'MEMBER'
}

interface LoginRecord {
  id: string
  loginAt: string
  ipAddress: string | null
  userAgent: string | null
  user: LoginUser
}

interface ApiResponse {
  records: LoginRecord[]
  total: number
  page: number
  limit: number
}

const PAGE_SIZE = 50

function parseBrowser(ua: string | null): string {
  if (!ua) return 'Unknown'
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome/') && !ua.includes('Chromium/')) return 'Chrome'
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari'
  if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera'
  return 'Browser'
}

function parseOS(ua: string | null): string {
  if (!ua) return ''
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('Windows NT')) return 'Windows'
  if (ua.includes('Mac OS X')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  return ''
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LoginHistoryPage() {
  const [records, setRecords] = useState<LoginRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchRecords = async (p: number) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/login-history?page=${p}&limit=${PAGE_SIZE}`)
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data: ApiResponse = await res.json()
      setRecords(data.records)
      setTotal(data.total)
      setPage(data.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load login history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRecords(1) }, [])

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return
    fetchRecords(p)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">Login History</h1>
          <p className="text-sm text-slate-500 dark:text-fmea-dim">
            {total > 0 ? `${total} login record${total === 1 ? '' : 's'}` : 'No logins recorded yet'}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 dark:text-fmea-dim">Loading…</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-fmea-dim">
          No login records found.
        </div>
      ) : (
        <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-fmea-bg3 border-b border-slate-200 dark:border-fmea-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Time
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    IP Address
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">
                  <span className="inline-flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5" />
                    Browser / OS
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-fmea-border">
              {records.map(rec => {
                const browser = parseBrowser(rec.userAgent)
                const os = parseOS(rec.userAgent)
                return (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-fmea-bg3 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-fmea-text">
                        {rec.user.name || rec.user.email}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-fmea-dim flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${rec.user.role === 'ADMIN' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'bg-slate-100 text-slate-600 dark:bg-fmea-bg3 dark:text-fmea-dim'}`}>
                          {rec.user.role === 'ADMIN' ? 'Admin' : 'Member'}
                        </span>
                        {rec.user.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-fmea-text whitespace-nowrap">
                      {formatDate(rec.loginAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-fmea-dim font-mono">
                      {rec.ipAddress ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-fmea-dim">
                      {os ? `${browser} / ${os}` : browser}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-fmea-border bg-slate-50 dark:bg-fmea-bg3">
              <p className="text-xs text-slate-500 dark:text-fmea-dim">
                Page {page} of {totalPages} · {total} records
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="p-1.5 rounded text-slate-500 dark:text-fmea-dim hover:bg-slate-200 dark:hover:bg-fmea-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded text-slate-500 dark:text-fmea-dim hover:bg-slate-200 dark:hover:bg-fmea-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
