import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'

const SYSTEM_PROMPT = `You are a CRM data extraction assistant for a freelance engineering consultant based in Europe.
The user will paste raw text from an email, LinkedIn message, or typed call notes.
Extract all available structured information and return ONLY a valid JSON object — no markdown, no explanation.

Return this exact shape (use null for anything not found or unclear):
{
  "contact": {
    "firstName": string | null,
    "lastName": string | null,
    "fullName": string | null,
    "company": string | null,
    "email": string | null,
    "phone": string | null,
    "linkedinUrl": string | null,
    "jobTitle": string | null
  },
  "enquiry": {
    "source": "EMAIL" | "CALL" | "LINKEDIN_MESSAGE" | "OTHER",
    "subject": string,
    "summary": string,
    "opportunityTitle": string | null,
    "estimatedValue": number | null,
    "currency": "EUR" | "GBP" | "USD",
    "nextAction": string | null,
    "urgency": "LOW" | "MEDIUM" | "HIGH"
  }
}

Rules:
- source: infer from context clues ("called me", "email", "LinkedIn", etc.). Default to OTHER.
- subject: a short action-oriented title for the activity log, e.g. "Introductory call — Siemens"
- summary: 2–3 sentences capturing what they want and any key context
- opportunityTitle: only set if this sounds like a real project/contract enquiry, e.g. "FMEA consultancy — Siemens Energy"
- estimatedValue: only if a budget, rate, or contract value is mentioned. Use the numeric value.
- currency: default EUR if not specified
- urgency: infer from language ("urgent", "ASAP" = HIGH; "when you have time" = LOW; default MEDIUM)`

export async function POST(request: NextRequest) {
  const session = requireSession()
  if (session instanceof NextResponse) return session

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to your Vercel environment variables.' },
      { status: 503 }
    )
  }

  try {
    const { text } = await request.json()
    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text.trim() }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[QUICK_CAPTURE_API_ERROR]', err)
      return NextResponse.json({ error: 'AI extraction failed. Please try again.' }, { status: 502 })
    }

    const data = await response.json()
    const raw = data.content?.[0]?.text ?? ''

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Try to extract JSON if model added surrounding text
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        parsed = JSON.parse(match[0])
      } else {
        throw new Error('Could not parse JSON from response')
      }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('[QUICK_CAPTURE_ERROR]', error)
    return NextResponse.json({ error: 'Failed to extract details. Please try again.' }, { status: 500 })
  }
}
