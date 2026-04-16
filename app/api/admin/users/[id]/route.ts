import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { hashPassword } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.email) updateData.email = body.email.toLowerCase().trim()
    if (body.role) updateData.role = body.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.password) updateData.passwordHash = hashPassword(body.password)

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })
    return NextResponse.json(user)
  } catch (error) {
    console.error('[ADMIN_UPDATE_USER_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = requireSession()
  if (session instanceof NextResponse) return session
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (params.id === session.userId) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  try {
    await prisma.user.update({ where: { id: params.id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN_DELETE_USER_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
