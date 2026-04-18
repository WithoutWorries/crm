import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10))
    const skip  = (page - 1) * limit

    const [records, total] = await Promise.all([
      prisma.loginRecord.findMany({
        orderBy: { loginAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      prisma.loginRecord.count(),
    ])

    return NextResponse.json({ records, total, page, limit })
  } catch (err) {
    console.error('[LOGIN_HISTORY_ERROR]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
