'use client'

import { formatRelativeDate } from '@/lib/utils'
import { Activity as ActivityType } from '@prisma/client'
import { Mail, Phone, MessageSquare, FileText, Users, Zap, BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ActivityWithRelations extends ActivityType {
  contact?: { id: string; fullName: string } | null
  opportunity?: { id: string; title: string } | null
}

interface RecentActivityProps {
  activities: ActivityWithRelations[]
}

const ACTIVITY_CONFIG: Record<string, { label: string; icon: any; chip: string; iconColor: string }> = {
  EMAIL:           { label: 'Email',          icon: Mail,          chip: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',     iconColor: 'text-blue-500' },
  CALL:            { label: 'Call',           icon: Phone,         chip: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', iconColor: 'text-emerald-500' },
  MEETING:         { label: 'Meeting',        icon: Users,         chip: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',  iconColor: 'text-violet-500' },
  LINKEDIN_MESSAGE:{ label: 'LinkedIn',       icon: MessageSquare, chip: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',          iconColor: 'text-sky-500' },
  PROPOSAL_SENT:   { label: 'Proposal',       icon: FileText,      chip: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',    iconColor: 'text-amber-500' },
  PROPOSAL_REVIEW: { label: 'Review',         icon: FileText,      chip: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300', iconColor: 'text-orange-500' },
  NOTE:            { label: 'Note',           icon: BookOpen,      chip: 'bg-slate-100 dark:bg-fmea-bg3 text-slate-600 dark:text-fmea-dim',        iconColor: 'text-slate-500' },
  FOLLOW_UP:       { label: 'Follow-up',      icon: ArrowRight,    chip: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',       iconColor: 'text-pink-500' },
  INTRO:           { label: 'Intro',          icon: Users,         chip: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',       iconColor: 'text-teal-500' },
  WORKSHOP:        { label: 'Workshop',       icon: Users,         chip: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300', iconColor: 'text-indigo-500' },
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border p-6 h-full">
      <h3 className="text-base font-semibold text-slate-900 dark:text-fmea-hi mb-4">Recent Activity</h3>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Zap className="h-8 w-8 text-slate-300 dark:text-fmea-border mb-2" />
          <p className="text-sm text-slate-500 dark:text-fmea-dim">No activities yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const cfg = ACTIVITY_CONFIG[activity.type] ?? { label: activity.type, icon: Zap, chip: 'bg-slate-100 text-slate-600', iconColor: 'text-slate-400' }
            const Icon = cfg.icon
            return (
              <div key={activity.id} className="flex gap-3">
                <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 dark:bg-fmea-bg3`}>
                  <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-900 dark:text-fmea-text truncate">{activity.subject}</p>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${cfg.chip}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {activity.contact && (
                      <Link href={`/contacts/${activity.contact.id}`} className="text-xs text-indigo-500 dark:text-fmea-accent hover:underline">
                        {activity.contact.fullName}
                      </Link>
                    )}
                    {activity.contact && activity.opportunity && <span className="text-xs text-slate-300 dark:text-fmea-border">·</span>}
                    {activity.opportunity && (
                      <Link href={`/opportunities/${activity.opportunity.id}`} className="text-xs text-slate-400 dark:text-fmea-dim hover:underline truncate max-w-28">
                        {activity.opportunity.title}
                      </Link>
                    )}
                    <span className="text-xs text-slate-400 dark:text-fmea-dim ml-auto flex-shrink-0">
                      {formatRelativeDate(activity.happenedAt)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
