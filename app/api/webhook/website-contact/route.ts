import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { readJsonObject } from '@/lib/request'

// Public endpoint — protected by a server-held shared secret.
// Called by the contact form on frasermackie.com alongside Formspree.
// Creates a contact record + activity log in SoloCRM automatically.

const DEFAULT_ALLOWED_ORIGINS = [
  'https://frasermackie.com',
  'https://www.frasermackie.com',
]

function allowedOrigins() {
  const configured = process.env.WEBSITE_ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  return configured?.length ? configured : DEFAULT_ALLOWED_ORIGINS
}

function corsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret',
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
  }
  if (origin && allowedOrigins().includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

function secretsMatch(provided: string, expected: string) {
  const providedHash = createHash('sha256').update(provided).digest()
  const expectedHash = createHash('sha256').update(expected).digest()
  return timingSafeEqual(providedHash, expectedHash)
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin || !allowedOrigins().includes(origin)) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 })
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) })
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request)
  try {
    const origin = request.headers.get('origin')
    if (origin && !allowedOrigins().includes(origin)) {
      return NextResponse.json({ error: 'Origin not allowed' }, { status: 403, headers })
    }

    const body = await readJsonObject(request, 32 * 1024)
    if (body instanceof NextResponse) return body
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 320) : ''
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 20_000) : ''

    const expectedSecret = process.env.WEBSITE_WEBHOOK_SECRET
    // The header is the secure server-to-server form. Body support is retained
    // temporarily for the existing website integration and should be removed once
    // frasermackie.com has moved its call behind a server-side handler.
    const legacyBodySecret = typeof body.secret === 'string' ? body.secret : ''
    const providedSecret = request.headers.get('x-webhook-secret') ?? legacyBodySecret
    if (!expectedSecret || !providedSecret || !secretsMatch(providedSecret, expectedSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    if (!name || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers })
    }

    const fullName = name
    const nameParts = fullName.split(/\s+/)
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || ''
    const cleanEmail = email || null

    // Find the admin user to assign the contact to
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true } })
    if (!adminUser) {
      return NextResponse.json({ error: 'No admin user found' }, { status: 500, headers })
    }

    // Find existing contact by email, or create new
    let contact = cleanEmail
      ? await prisma.contact.findFirst({
          where: { email: cleanEmail, user: { workspaceId: adminUser.workspaceId } },
        })
      : null

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          userId: adminUser.id,
          firstName,
          lastName,
          fullName,
          email: cleanEmail,
          influenceLevel: 'UNKNOWN',
          relationshipType: 'COLD',
        },
      })
    }

    // Log the website enquiry as an activity
    await prisma.activity.create({
      data: {
        userId: adminUser.id,
        type: 'EMAIL',
        subject: `Website enquiry — ${fullName}`,
        summary: message,
        happenedAt: new Date(),
        contactId: contact.id,
      },
    })

    return NextResponse.json({ success: true }, { headers })
  } catch (error) {
    console.error('[WEBSITE_WEBHOOK_ERROR]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}
