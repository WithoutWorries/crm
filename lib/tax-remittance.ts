import { optionalString } from './request'
import { parseDateOnly } from './tax'

export interface ValidWorkSession {
  userId: string
  workDate: Date
  hours: string
  activity: string | null
  projectLabel: string | null
  sourcePage: number | null
}

export function parseWorkSessions(
  value: unknown,
  userId: string,
  fallbackProjectLabel: string | null = null
): { ok: true; workSessions: ValidWorkSession[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) return { ok: true, workSessions: [] }
  const workSessions: ValidWorkSession[] = []

  for (const item of value.slice(0, 600)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { ok: false, error: 'A work-session row is invalid' }
    }
    const workDate = parseDateOnly(item.workDate)
    const normalizedHours = typeof item.hours === 'string'
      ? item.hours.trim().replace(',', '.')
      : String(item.hours ?? '')
    const hours = Number(normalizedHours)
    if (!workDate || !Number.isFinite(hours) || hours <= 0 || hours > 24) {
      return { ok: false, error: 'Each work session needs a valid date and 0–24 hours' }
    }
    const sourcePage = Number(item.sourcePage)
    workSessions.push({
      userId,
      workDate,
      hours: hours.toFixed(2),
      activity: optionalString(item.activity, 240),
      projectLabel: optionalString(item.projectLabel, 160) ?? fallbackProjectLabel,
      sourcePage: Number.isInteger(sourcePage) && sourcePage >= 1 && sourcePage <= 600 ? sourcePage : null,
    })
  }

  const hoursByDate = new Map<string, number>()
  for (const workSession of workSessions) {
    const key = workSession.workDate.toISOString().slice(0, 10)
    const total = (hoursByDate.get(key) ?? 0) + Number(workSession.hours)
    if (total > 24) return { ok: false, error: `Work sessions exceed 24 hours on ${key}` }
    hoursByDate.set(key, total)
  }

  return { ok: true, workSessions }
}
