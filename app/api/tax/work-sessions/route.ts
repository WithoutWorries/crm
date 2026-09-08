import { NextRequest, NextResponse } from 'next/server'
import { requireActiveSession } from '@/lib/session'
import { getWorkYearData } from '@/lib/work-sessions'

export async function GET(request: NextRequest) {
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session

  const year = Number(request.nextUrl.searchParams.get('year'))
  if (!Number.isInteger(year) || year < 1990 || year > 2200) {
    return NextResponse.json({ error: 'Choose a valid year' }, { status: 400 })
  }
  const projectValue = request.nextUrl.searchParams.get('project')?.trim() || null
  if (projectValue && projectValue.length > 160) {
    return NextResponse.json({ error: 'Project label is too long' }, { status: 400 })
  }

  const data = await getWorkYearData(session.userId, year, projectValue)
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
