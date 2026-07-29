import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireActiveSession } from '@/lib/session'
import { hashPassword } from '@/lib/auth'
import { readJsonObject } from '@/lib/request'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const target = await prisma.user.findFirst({
      where: { id, workspaceId: session.workspaceId },
      select: { id: true, role: true, isActive: true },
    })
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await readJsonObject(request, 16 * 1024)
    if (body instanceof NextResponse) return body
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) {
      updateData.name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : null
    }
    if (body.email && typeof body.email === 'string') {
      updateData.email = body.email.toLowerCase().trim().slice(0, 320)
    }
    if (body.role !== undefined) {
      if (body.role !== 'ADMIN' && body.role !== 'MEMBER') {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updateData.role = body.role
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 })
      }
      if (id === session.userId && !body.isActive) {
        return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 })
      }
      updateData.isActive = body.isActive
    }
    if (body.password) {
      if (typeof body.password !== 'string' || body.password.length < 12) {
        return NextResponse.json(
          { error: 'Password must contain at least 12 characters' },
          { status: 400 }
        )
      }
      updateData.passwordHash = hashPassword(body.password)
    }

    const removesActiveAdmin =
      target.role === 'ADMIN' &&
      target.isActive &&
      (body.role === 'MEMBER' || body.isActive === false)
    if (removesActiveAdmin) {
      const activeAdminCount = await prisma.user.count({
        where: { workspaceId: session.workspaceId, role: 'ADMIN', isActive: true },
      })
      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: 'The workspace must retain at least one active administrator' },
          { status: 400 }
        )
      }
    }

    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, name: true, email: true, role: true, isActive: true },
      }),
      ...(body.password || body.isActive === false || body.role
        ? [prisma.session.deleteMany({ where: { userId: id } })]
        : []),
    ])
    return NextResponse.json(user)
  } catch (error) {
    console.error('[ADMIN_UPDATE_USER_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireActiveSession()
  if (session instanceof NextResponse) return session
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (id === session.userId) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  try {
    const target = await prisma.user.findFirst({
      where: { id, workspaceId: session.workspaceId },
      select: { id: true },
    })
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { isActive: false } }),
      prisma.session.deleteMany({ where: { userId: id } }),
    ])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN_DELETE_USER_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
