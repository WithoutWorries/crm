import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isPast, isToday, isTomorrow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Coerce a value that might be a Date object or an ISO string into a real Date.
// API responses from Next.js serialize dates as strings, so this is needed everywhere.
function toDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null
  if (date instanceof Date) return date
  const d = new Date(date)
  return isNaN(d.getTime()) ? null : d
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'GBP'
): string {
  if (amount === null || amount === undefined || amount === '') return '—'

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return '—'

  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return formatter.format(numAmount)
}

export function formatDate(date: Date | string | null | undefined): string {
  const d = toDate(date)
  if (!d) return '—'
  return format(d, 'dd MMM yyyy')
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  const d = toDate(date)
  if (!d) return '—'

  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isPast(d)) {
    const daysAgo = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (daysAgo === 1) return 'Yesterday'
    return `${daysAgo} days ago`
  }

  const daysUntil = Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntil === 1) return 'Tomorrow'
  return `In ${daysUntil} days`
}

export function calculateWeightedValue(
  estimatedValue: number | string | null | undefined,
  probabilityPercent: number | null | undefined
): number {
  if (!estimatedValue || !probabilityPercent) return 0

  const value = typeof estimatedValue === 'string' ? parseFloat(estimatedValue) : estimatedValue
  if (isNaN(value) || isNaN(probabilityPercent)) return 0

  return Math.round((value * probabilityPercent) / 100)
}

export function isOverdue(dueDate: Date | string | null | undefined): boolean {
  const d = toDate(dueDate)
  if (!d) return false
  return isPast(d) && !isToday(d)
}

export function isDueToday(dueDate: Date | string | null | undefined): boolean {
  const d = toDate(dueDate)
  if (!d) return false
  return isToday(d)
}

export function isDueSoon(dueDate: Date | string | null | undefined): boolean {
  const d = toDate(dueDate)
  if (!d) return false
  const daysUntil = Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return daysUntil >= 0 && daysUntil <= 7
}

export function getInitials(firstName: string, lastName?: string | null): string {
  if (!firstName) return '?'
  if (!lastName) return firstName.charAt(0).toUpperCase()
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
