'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// How long before signing the user out (30 minutes)
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000
// How long before timeout to show the warning (2 minutes)
const WARNING_BEFORE_MS = 2 * 60 * 1000
// How often to refresh the session cookie while the user is active (every 5 minutes)
const REFRESH_INTERVAL_MS = 5 * 60 * 1000

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

export function InactivityTimer() {
  const router = useRouter()
  const lastActivityRef = useRef(Date.now())
  const lastRefreshRef = useRef(Date.now())
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(WARNING_BEFORE_MS / 1000))
  const warningIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }, [router])

  const refreshSession = useCallback(async () => {
    try {
      await fetch('/api/auth/refresh', { method: 'POST' })
      lastRefreshRef.current = Date.now()
    } catch {
      // silently ignore — next refresh will try again
    }
  }, [])

  const dismissWarning = useCallback(() => {
    setShowWarning(false)
    setSecondsLeft(Math.floor(WARNING_BEFORE_MS / 1000))
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current)
      warningIntervalRef.current = null
    }
    lastActivityRef.current = Date.now()
    refreshSession()
  }, [refreshSession])

  // Record activity
  useEffect(() => {
    const onActivity = () => {
      lastActivityRef.current = Date.now()

      // Refresh session cookie if enough time has passed
      if (Date.now() - lastRefreshRef.current >= REFRESH_INTERVAL_MS) {
        refreshSession()
      }

      // If the warning is showing and the user does something, dismiss it
      if (showWarning) {
        dismissWarning()
      }
    }

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
    }
  }, [showWarning, dismissWarning, refreshSession])

  // Main inactivity check — runs every 10 seconds
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current
      const timeToTimeout = INACTIVITY_LIMIT_MS - idle

      if (timeToTimeout <= 0) {
        // Time's up — sign out immediately
        clearInterval(checkInterval)
        signOut()
        return
      }

      if (timeToTimeout <= WARNING_BEFORE_MS && !showWarning) {
        // Enter warning phase
        const secs = Math.floor(timeToTimeout / 1000)
        setSecondsLeft(secs)
        setShowWarning(true)

        warningIntervalRef.current = setInterval(() => {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              clearInterval(warningIntervalRef.current!)
              signOut()
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    }, 10_000)

    return () => clearInterval(checkInterval)
  }, [showWarning, signOut])

  // Cleanup warning interval on unmount
  useEffect(() => {
    return () => {
      if (warningIntervalRef.current) clearInterval(warningIntervalRef.current)
    }
  }, [])

  if (!showWarning) return null

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const timeDisplay = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : `${secs}s`

  // Progress for the ring: 0 → full as time runs out
  const progress = 1 - secondsLeft / Math.floor(WARNING_BEFORE_MS / 1000)
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-fmea-bg2 rounded-2xl shadow-2xl border border-slate-200 dark:border-fmea-border p-8 max-w-sm w-full mx-4 text-center">

        {/* Countdown ring */}
        <div className="flex justify-center mb-5">
          <svg width="72" height="72" className="-rotate-90">
            {/* Track */}
            <circle
              cx="36" cy="36" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-slate-200 dark:text-fmea-bg3"
            />
            {/* Progress */}
            <circle
              cx="36" cy="36" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={secondsLeft <= 30 ? 'text-red-500' : 'text-amber-500'}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute flex items-center justify-center" style={{ width: 72, height: 72, marginTop: 0 }}>
            <span className={`text-lg font-bold tabular-nums ${secondsLeft <= 30 ? 'text-red-500' : 'text-amber-500 dark:text-amber-400'}`}>
              {timeDisplay}
            </span>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-fmea-hi mb-2">
          Still there?
        </h2>
        <p className="text-sm text-slate-500 dark:text-fmea-dim mb-6">
          You&apos;ve been inactive for a while. For your security, you&apos;ll be signed out in{' '}
          <span className={`font-medium ${secondsLeft <= 30 ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
            {timeDisplay}
          </span>{' '}
          unless you continue.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={dismissWarning}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 dark:bg-fmea-accent dark:text-fmea-bg dark:hover:opacity-90 transition-colors"
          >
            Continue session
          </button>
          <button
            onClick={signOut}
            className="px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-600 dark:text-fmea-dim text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-border transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
