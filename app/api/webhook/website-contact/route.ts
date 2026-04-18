import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint — protected by shared secret in request body.
// Called by the contact form on frasermackie.com alongside Formspree.
// Creates a contact record + activity log in SoloCRM automatically.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message, secret } = body

    // Verify shared secret (set WEBSITE_WEBHOOK_SECRET in Vercel env vars)
    const expectedSecret = process.env.WEBSITE_WEBHOOK_SECRET
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!name?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const fullName = (name as string).trim()
    const nameParts = fullName.split(/\s+/)
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || ''
    const cleanEmail = email?.trim().toLowerCase() || null

    // Find existing contact by email, or create new
    let contact = cleanEmail
      ? await prisma.contact.findFirst({ where: { email: cleanEmail } })
      : null

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          firstName,
          lastName,
          fullName,
          email: cleanEmail,
          influenceLevel: 'UNKNOWN',
          relationshipType: 'NEW',
        },
      })
    }

    // Log the website enquiry as an activity
    await prisma.activity.create({
      data: {
        type: 'EMAIL',
        subject: `Website enquiry — ${fullName}`,
        summary: (message as string).trim(),
        happenedAt: new Date(),
        contactId: contact.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[WEBSITE_WEBHOOK_ERROR]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
