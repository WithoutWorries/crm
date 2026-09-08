import { prisma } from '@/lib/prisma'
import { toDateOnly } from '@/lib/tax-calculations'

export interface WorkSessionView {
  id: string
  workDate: string
  hours: number
  activity: string | null
  projectLabel: string | null
  sourcePage: number | null
}

export interface WorkYearData {
  year: number
  totalHours: number
  workDays: number
  averageHoursPerDay: number
  projectLabels: string[]
  selectedProject: string | null
  sessions: WorkSessionView[]
}

export async function getWorkYearData(
  userId: string,
  year: number,
  selectedProject: string | null = null
): Promise<WorkYearData> {
  const start = new Date(Date.UTC(year, 0, 1, 12))
  const end = new Date(Date.UTC(year + 1, 0, 1, 12))
  const baseWhere = { userId, workDate: { gte: start, lt: end } }
  const [rows, projectRows] = await Promise.all([
    prisma.workSession.findMany({
      where: {
        ...baseWhere,
        ...(selectedProject ? { projectLabel: selectedProject } : {}),
      },
      orderBy: [{ workDate: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.workSession.findMany({
      where: { ...baseWhere, projectLabel: { not: null } },
      distinct: ['projectLabel'],
      select: { projectLabel: true },
      orderBy: { projectLabel: 'asc' },
    }),
  ])

  const sessions = rows.map((row) => ({
    id: row.id,
    workDate: toDateOnly(row.workDate),
    hours: Number(row.hours),
    activity: row.activity,
    projectLabel: row.projectLabel,
    sourcePage: row.sourcePage,
  }))
  const totalHours = sessions.reduce((total, row) => total + row.hours, 0)
  const workDays = new Set(sessions.map((row) => row.workDate)).size

  return {
    year,
    totalHours,
    workDays,
    averageHoursPerDay: workDays ? totalHours / workDays : 0,
    projectLabels: projectRows.flatMap((row) => row.projectLabel ? [row.projectLabel] : []),
    selectedProject,
    sessions,
  }
}
