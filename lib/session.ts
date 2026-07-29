/**
 * Revocable database-backed sessions.
 *
 * Cookie format:
 *   ${sessionId}|${randomSecret}|${role}|${expiresAtUnix}|${hmac_sha256_hex}
 *
 * Middleware can verify the signature and expiry without database access. API
 * handlers additionally match the secret hash against a live Session record
 * and confirm that the user remains active.
 */
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const COOKIE_NAME = 'solo-crm-session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export interface ActiveSession {
  sessionId: string
  userId: string
  workspaceId: string
  role: 'ADMIN' | 'MEMBER'
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set to at least 32 characters')
  }
  return secret
}

function hashTokenSecret(tokenSecret: string): string {
  return crypto.createHash('sha256').update(tokenSecret).digest('hex')
}

function signToken(
  sessionId: string,
  tokenSecret: string,
  role: 'ADMIN' | 'MEMBER',
  expiresAt: number
): string {
  const payload = `${sessionId}|${tokenSecret}|${role}|${expiresAt}`
  const signature = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
  return `${payload}|${signature}`
}

export function verifySessionToken(
  token: string
): {
  sessionId: string
  tokenSecret: string
  role: 'ADMIN' | 'MEMBER'
  expiresAt: number
} | null {
  const parts = token.split('|')
  if (parts.length !== 5) return null
  const [sessionId, tokenSecret, role, expiresAtValue, signature] = parts
  const expiresAt = Number.parseInt(expiresAtValue, 10)
  if (
    !sessionId ||
    (role !== 'ADMIN' && role !== 'MEMBER') ||
    !/^[a-f0-9]{64}$/i.test(tokenSecret) ||
    !/^[a-f0-9]{64}$/i.test(signature) ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return null
  }

  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(`${sessionId}|${tokenSecret}|${role}|${expiresAt}`)
    .digest('hex')

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
      return null
    }
  } catch {
    return null
  }

  return { sessionId, tokenSecret, role, expiresAt }
}

export async function createSession(
  userId: string,
  role: 'ADMIN' | 'MEMBER',
  metadata: { userAgent?: string | null; ipAddress?: string | null } = {}
): Promise<string> {
  const tokenSecret = crypto.randomBytes(32).toString('hex')
  const expiresAtUnix = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashTokenSecret(tokenSecret),
      expiresAt: new Date(expiresAtUnix * 1000),
      userAgent: metadata.userAgent?.slice(0, 500) || null,
      ipAddress: metadata.ipAddress?.slice(0, 100) || null,
    },
    select: { id: true },
  })

  return signToken(session.id, tokenSecret, role, expiresAtUnix)
}

export async function getSession(): Promise<ActiveSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const parsed = verifySessionToken(token)
  if (!parsed) return null

  const session = await prisma.session.findFirst({
    where: {
      id: parsed.sessionId,
      tokenHash: hashTokenSecret(parsed.tokenSecret),
      expiresAt: { gt: new Date() },
      user: { isActive: true },
    },
    select: {
      id: true,
      userId: true,
      lastSeenAt: true,
      user: { select: { role: true, workspaceId: true } },
    },
  })

  if (!session) return null

  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60 * 1000) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    })
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    workspaceId: session.user.workspaceId,
    role: session.user.role,
  }
}

export async function requireSession(): Promise<ActiveSession | NextResponse> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthenticated' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }
  return session
}

export const requireActiveSession = requireSession

export async function refreshSession(
  sessionId: string,
  role: 'ADMIN' | 'MEMBER'
): Promise<string | null> {
  const tokenSecret = crypto.randomBytes(32).toString('hex')
  const expiresAtUnix = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        tokenHash: hashTokenSecret(tokenSecret),
        expiresAt: new Date(expiresAtUnix * 1000),
        lastSeenAt: new Date(),
      },
    })
    return signToken(sessionId, tokenSecret, role, expiresAtUnix)
  } catch {
    return null
  }
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId } })
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/',
  })
}
