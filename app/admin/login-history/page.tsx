'use client'

import { useEffect, useState, useCallback } from 'react'
import { Monitor, Smartphone, Globe, RefreshCw, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

interface LoginRecord {
  id: string
  userId: string
  ipAddress: string | null
  userAgent: string | null
  loginAt: string
  user: {
    id: string
    name: string | null
    email: string
    role: 'ADMIN' | 'MEMBER'
  }
}

interface ApiResponse {
  records: LoginRecord[]
  total: number
  page: number
  limit: number
}

/** Very simple UA parser — good enough without a library */
function parseUA(ua: string | null): { browser: string; os: string; isMobile: boolean } {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', isMobile: false }
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua)
  const browser =
    /Edg\//i.test(ua)    ? 'Edge' :
    /Chrome\//i.test(ua) ? 'Chrome' :
    /Firefox\//i.test(ua)? 'Firefox' :
    /Safari\//i.test(ua) ? 'Safari' :
    /curl/i.test(ua)     ? 'curl' : 'Other'
  const os =
    /Windows/i.test(ua)  ? 'Windows' :
    /Mac OS X/i.test(ua) ? 'macOS' :
    /Linux/i.test(ua)    ? 'Linux' :
    /Android/i.test(ua)  ? 'Android' :
    /iPhone|iPad/i.test(ua) ? 'iOS' : 'Other'
  return { browser, os, isMobile: mobile }
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    relative: relativeTime(d),
  }
}

function relativeTime(d: Date) {
  const diff = Date.now() - d.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30)  return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

const LIMIT = 50

export default function LoginHistoryPage() {
  const [data,    setData]    = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/login-history?page=${p}&limit=${LIMIT}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json: ApiResponse = await res.json()
      setData(json)
      setPage(p)
    } catch {
      setError('Could not load login history.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-fmea-text">Login History</h1>
            <p className="text-sm text-fmea-muted">
              {data ? `${data.total.toLocaleString()} login event${data.total !== 1 ? 's' : ''} recorded` : 'Loading…'}
            </p>
          </div>
        </div>

        <button
          onClick={() => load(page)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-fmea-border text-fmea-muted hover:text-fmea-text hover:border-fmea-muted transition-colors text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>
      )}

      {/* Empty state */}
      {!loading && data?.records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="w-12 h-12 text-fmea-muted mb-4 opacity-40" />
          <p className="text-fmea-muted text-sm">No login events recorded yet.</p>
          <p className="text-fmea-muted text-xs mt-1 opacity-70">Events appear here after the next login.</p>
        </div>
      )}

      {/* Table */}
      {(loading || (data && data.records.length > 0)) && (
        <div className="rounded-xl border border-fmea-border bg-fmea-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fmea-border bg-fmea-surface2">
                <th className="text-left px-5 py-3 text-xs font-semibold text-fmea-muted uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-fmea-muted uppercase tracking-wider">Date &amp; Time</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-fmea-muted uppercase tracking-wider">Browser / OS</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-fmea-muted uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-fmea-border/50 animate-pulse">
                      <td className="px-5 py-4"><div className="h-4 bg-fmea-surface2 rounded w-40" /></td>
                      <td className="px-5 py-4"><div className="h-4 bg-fmea-surface2 rounded w-32" /></td>
                      <td className="px-5 py-4"><div className="h-4 bg-fmea-surface2 rounded w-28" /></td>
                      <td className="px-5 py-4"><div className="h-4 bg-fmea-surface2 rounded w-24" /></td>
                    </tr>
                  ))
                : data!.records.map((rec) => {
                    const { browser, os, isMobile } = parseUA(rec.userAgent)
                    const { date, time, relative }   = formatDateTime(rec.loginAt)
                    const isAdmin = rec.user.role === 'ADMIN'

                    return (
                      <tr key={rec.id} className="border-b border-fmea-border/50 hover:bg-fmea-surface2/50 transition-colors">

                        {/* User */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isAdmin
                                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                                : 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                            }`}>
                              {(rec.user.name ?? rec.user.email)[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-fmea-text">
                                {rec.user.name ?? rec.user.email}
                              </div>
                              <div className="text-xs text-fmea-muted flex items-center gap-1.5 mt-0.5">
                                {rec.user.name && <span className="opacity-70">{rec.user.email}</span>}
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isAdmin
                                    ? 'bg-cyan-500/15 text-cyan-400'
                                    : 'bg-violet-500/15 text-violet-400'
                                }`}>
                                  {rec.user.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="px-5 py-4">
                          <div className="font-medium text-fmea-text">{date}</div>
                          <div className="text-xs text-fmea-muted mt-0.5 flex items-center gap-1.5">
                            <span>{time}</span>
                            <span className="opacity-50">·</span>
                            <span className="text-cyan-500/70">{relative}</span>
                          </div>
                        </td>

                        {/* Browser / OS */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-fmea-text">
                            {isMobile
                              ? <Smartphone className="w-3.5 h-3.5 text-fmea-muted flex-shrink-0" />
                              : <Monitor    className="w-3.5 h-3.5 text-fmea-muted flex-shrink-0" />
                            }
                            <span>{browser}</span>
                          </div>
                          <div className="text-xs text-fmea-muted mt-0.5 pl-5">{os}</div>
                        </td>

                        {/* IP */}
                        <td className="px-5 py-4">
                          {rec.ipAddress ? (
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-fmea-muted flex-shrink-0" />
                              <span className="font-mono text-xs text-fmea-text">{rec.ipAddress}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-fmea-muted opacity-50">—</span>
                          )}
                        </td>

                      </tr>
                    )
                  })
              }
            </tbody>
          </table>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-fmea-border bg-fmea-surface2">
              <span className="text-xs text-fmea-muted">
                Page {page} of {totalPages} · {data!.total} total
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded border border-fmea-border text-fmea-muted hover:text-fmea-text disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded border border-fmea-border text-fmea-muted hover:text-fmea-text disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
