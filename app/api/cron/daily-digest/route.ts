import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PRIORITY_EMOJI: Record<string, string> = {
  HIGH: '🔴',
  MEDIUM: '🟡',
  LOW: '🟢',
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character]!
  )
}

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const retentionCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const purgedKnowledgeNotes = await prisma.note.deleteMany({
    where: {
      isKnowledge: true,
      deletedAt: { lte: retentionCutoff },
    },
  })
  if (purgedKnowledgeNotes.count > 0) {
    await prisma.securityEvent.create({
      data: {
        eventType: 'KNOWLEDGE_RETENTION_PURGE',
        outcome: 'SUCCESS',
        metadata: {
          count: purgedKnowledgeNotes.count,
          retentionCutoff: retentionCutoff.toISOString(),
        },
      },
    })
  }

  const resendKey = process.env.RESEND_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!resendKey || !anthropicKey) {
    return NextResponse.json({ error: 'Missing RESEND_API_KEY or ANTHROPIC_API_KEY' }, { status: 503 })
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Fetch all active users who have tasks
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
  })

  let sent = 0

  for (const user of users) {
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        contact: { select: { fullName: true } },
        opportunity: { select: { title: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }],
    })

    if (tasks.length === 0) continue

    const overdue     = tasks.filter(t => t.dueDate && t.dueDate < today)
    const dueToday    = tasks.filter(t => t.dueDate && t.dueDate.toDateString() === today.toDateString())
    const dueThisWeek = tasks.filter(t => t.dueDate && t.dueDate > today && t.dueDate <= weekFromNow)
    const later       = tasks.filter(t => !t.dueDate || t.dueDate > weekFromNow)

    const firstName = user.name?.split(' ')[0] ?? 'there'
    const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

    // Build a plain-text task summary for the AI prompt
    const taskLines = tasks.map(t => {
      const due = t.dueDate ? t.dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'no due date'
      const overdueMark = t.dueDate && t.dueDate < today ? ' [OVERDUE]' : ''
      const context = t.contact ? ` — ${t.contact.fullName}` : t.opportunity ? ` — ${t.opportunity.title}` : ''
      return `${PRIORITY_EMOJI[t.priority] ?? '•'} ${t.title}${context} (due ${due}${overdueMark})`
    }).join('\n')

    const aiPrompt = `Today is ${dateStr}. You are writing a short daily task digest email to ${firstName}, a freelance engineering consultant.

Here are their outstanding CRM tasks:
${taskLines}

Write a short, natural email body — no subject line, no greeting (it will be added), no sign-off (it will be added).
- 2–4 sentences max before the task list
- The tone should feel like a smart assistant, not a robot. Vary the opening so it never feels like a template.
- If there are overdue tasks, acknowledge them without being preachy.
- After your intro sentences, output the task list exactly as given above (do not reformat it).
- End with one brief sentence of encouragement or a practical nudge — different each time.
- Plain text only, no markdown.`

    let aiBody = ''
    try {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          messages: [{ role: 'user', content: aiPrompt }],
        }),
      })
      if (aiRes.ok) {
        const aiData = await aiRes.json()
        aiBody = aiData.content?.[0]?.text?.trim() ?? ''
      }
    } catch (err) {
      console.error('[DIGEST_AI_ERROR]', err)
    }

    // Fallback if AI fails
    if (!aiBody) {
      aiBody = `You have ${tasks.length} outstanding task${tasks.length !== 1 ? 's' : ''} — ${overdue.length > 0 ? `${overdue.length} overdue. ` : ''}here's where things stand:\n\n${taskLines}`
    }

    const statsLine = [
      overdue.length     > 0 ? `${overdue.length} overdue`      : '',
      dueToday.length    > 0 ? `${dueToday.length} due today`   : '',
      dueThisWeek.length > 0 ? `${dueThisWeek.length} this week`: '',
      later.length       > 0 ? `${later.length} later`          : '',
    ].filter(Boolean).join(' · ')
    const safeDate = escapeHtml(dateStr)
    const safeFirstName = escapeHtml(firstName)
    const safeStatsLine = escapeHtml(statsLine)
    const safeAiBody = escapeHtml(aiBody)

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;background:#f8fafc;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 32px;">
      <p style="color:#c7d2fe;font-size:13px;margin:0 0 4px;">CRM Daily Digest · ${safeDate}</p>
      <h1 style="color:#ffffff;font-size:22px;font-weight:600;margin:0;">Good morning, ${safeFirstName}</h1>
    </div>
    <div style="padding:28px 32px;">
      ${safeStatsLine ? `<div style="background:#f1f5f9;border-radius:8px;padding:10px 16px;font-size:13px;color:#64748b;margin-bottom:20px;">${safeStatsLine}</div>` : ''}
      <div style="font-size:15px;line-height:1.7;white-space:pre-line;color:#334155;">${safeAiBody}</div>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <a href="https://crm.frasermackie.com/tasks" style="color:#4f46e5;font-size:13px;text-decoration:none;">Open tasks in CRM →</a>
    </div>
  </div>
</body>
</html>`

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'CRM Digest <digest@frasermackie.com>',
          to: [user.email],
          subject: `${overdue.length > 0 ? `⚠️ ${overdue.length} overdue — ` : ''}${tasks.length} task${tasks.length !== 1 ? 's' : ''} outstanding · ${dateStr}`,
          html: htmlBody,
        }),
      })
      sent++
    } catch (err) {
      console.error(`[DIGEST_SEND_ERROR] ${user.email}`, err)
    }
  }

  return NextResponse.json({ ok: true, sent, purgedKnowledgeNotes: purgedKnowledgeNotes.count })
}
