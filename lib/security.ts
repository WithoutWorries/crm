import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_BLOCK_MS = 15 * 60 * 1000
const MAX_LOGIN_FAILURES = 5

export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null
}

function loginKey(email: string, ipAddress: string | null): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is required')
  return crypto
    .createHmac('sha256', secret)
    .update(`${email.toLowerCase().trim()}|${ipAddress || 'unknown'}`)
    .digest('hex')
}

export async function isLoginBlocked(
  email: string,
  ipAddress: string | null
): Promise<boolean> {
  const keyHash = loginKey(email, ipAddress)
  const throttle = await prisma.loginThrottle.findUnique({ where: { keyHash } })
  if (!throttle) return false

  const now = new Date()
  if (throttle.blockedUntil && throttle.blockedUntil > now) return true

  if (now.getTime() - throttle.windowStartedAt.getTime() > LOGIN_WINDOW_MS) {
    await prisma.loginThrottle.delete({ where: { keyHash } })
  }
  return false
}

export async function recordLoginFailure(
  email: string,
  ipAddress: string | null,
  userId?: string
): Promise<void> {
  const keyHash = loginKey(email, ipAddress)
  const now = new Date()
  const current = await prisma.loginThrottle.findUnique({ where: { keyHash } })
  const outsideWindow =
    !current || now.getTime() - current.windowStartedAt.getTime() > LOGIN_WINDOW_MS
  const failureCount = outsideWindow ? 1 : current.failureCount + 1
  const blockedUntil =
    failureCount >= MAX_LOGIN_FAILURES ? new Date(now.getTime() + LOGIN_BLOCK_MS) : null

  await prisma.$transaction([
    prisma.loginThrottle.upsert({
      where: { keyHash },
      create: {
        keyHash,
        failureCount,
        windowStartedAt: now,
        blockedUntil,
      },
      update: {
        failureCount,
        windowStartedAt: outsideWindow ? now : current.windowStartedAt,
        blockedUntil,
      },
    }),
    prisma.securityEvent.create({
      data: {
        userId: userId || null,
        eventType: 'LOGIN',
        outcome: blockedUntil ? 'BLOCKED' : 'FAILED',
        ipAddress,
        metadata: { failureCount },
      },
    }),
  ])
}

export async function recordLoginSuccess(
  email: string,
  ipAddress: string | null,
  userId: string,
  userAgent: string | null
): Promise<void> {
  const keyHash = loginKey(email, ipAddress)
  await prisma.$transaction([
    prisma.loginThrottle.deleteMany({ where: { keyHash } }),
    prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'LOGIN',
        outcome: 'SUCCESS',
        ipAddress,
        userAgent: userAgent?.slice(0, 500) || null,
      },
    }),
    prisma.loginRecord.create({
      data: {
        userId,
        ipAddress,
        userAgent: userAgent?.slice(0, 500) || null,
      },
    }),
  ])
}

export async function recordSecurityEvent(input: {
  userId?: string | null
  eventType: string
  outcome: string
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, string | number | boolean | null>
}): Promise<void> {
  await prisma.securityEvent.create({
    data: {
      userId: input.userId || null,
      eventType: input.eventType,
      outcome: input.outcome,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent?.slice(0, 500) || null,
      metadata: input.metadata,
    },
  })
}
