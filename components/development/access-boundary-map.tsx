'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Ban,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Clock3,
  Folder,
  Settings,
  ShieldCheck,
  User,
  Users,
  Wrench,
} from 'lucide-react'

type Persona = 'ADMIN' | 'MEMBER' | 'CUSTOMER'
type AccessState = 'PRIVATE' | 'SHARED' | 'RESTRICTED' | 'ADMIN_ONLY' | 'NONE' | 'PLANNED'

interface AccessRule {
  state: AccessState
  scope: string
  note: string
}

interface BoundaryZone {
  id: string
  label: string
  description: string
  icon: LucideIcon
  access: Record<Persona, AccessRule>
}

const PERSONAS: Array<{
  id: Persona
  label: string
  shortLabel: string
  icon: LucideIcon
}> = [
  { id: 'ADMIN', label: 'Administrator', shortLabel: 'Admin', icon: ShieldCheck },
  { id: 'MEMBER', label: 'Internal member', shortLabel: 'Member', icon: User },
  { id: 'CUSTOMER', label: 'Future customer', shortLabel: 'Customer', icon: Building2 },
]

const ZONES: BoundaryZone[] = [
  {
    id: 'personal',
    label: 'Personal vault',
    description: 'Knowledge and Procurement',
    icon: BookOpen,
    access: {
      ADMIN: {
        state: 'PRIVATE',
        scope: 'Own records only',
        note: 'Administrator status does not expose another user’s private Knowledge.',
      },
      MEMBER: {
        state: 'PRIVATE',
        scope: 'Own records only',
        note: 'Private notes and procurement records stay with their author.',
      },
      CUSTOMER: {
        state: 'NONE',
        scope: 'No access',
        note: 'Internal personal records never enter the customer boundary.',
      },
    },
  },
  {
    id: 'workspace',
    label: 'Consultancy workspace',
    description: 'Enquiries, CRM, tasks and activities',
    icon: Users,
    access: {
      ADMIN: {
        state: 'SHARED',
        scope: 'Shared internally',
        note: 'Visible to trusted users in the internal Reference workspace.',
      },
      MEMBER: {
        state: 'SHARED',
        scope: 'Shared internally',
        note: 'The current two-person consultancy workflow is preserved.',
      },
      CUSTOMER: {
        state: 'NONE',
        scope: 'No access',
        note: 'Customers will not inherit broad CRM or enquiry access.',
      },
    },
  },
  {
    id: 'projects',
    label: 'Engineering projects',
    description: 'Sources, baselines and analyses',
    icon: Folder,
    access: {
      ADMIN: {
        state: 'PLANNED',
        scope: 'Authorised projects',
        note: 'Stage 1 introduces project membership and controlled baselines.',
      },
      MEMBER: {
        state: 'PLANNED',
        scope: 'Assigned projects',
        note: 'Internal access will be explicit rather than assumed.',
      },
      CUSTOMER: {
        state: 'PLANNED',
        scope: 'Invited project only',
        note: 'Stage 7 adds project-specific customer permissions.',
      },
    },
  },
  {
    id: 'administration',
    label: 'Administration',
    description: 'Users, security, backup and roadmap',
    icon: Settings,
    access: {
      ADMIN: {
        state: 'ADMIN_ONLY',
        scope: 'Administrator only',
        note: 'Includes this boundary view, user controls and workspace backup.',
      },
      MEMBER: {
        state: 'NONE',
        scope: 'No access',
        note: 'Server-side authorization blocks administrative routes.',
      },
      CUSTOMER: {
        state: 'NONE',
        scope: 'No access',
        note: 'Administrative controls remain outside every customer project.',
      },
    },
  },
  {
    id: 'service',
    label: 'In-service feedback',
    description: 'FRACAS and DRACAS',
    icon: Wrench,
    access: {
      ADMIN: {
        state: 'PLANNED',
        scope: 'Project oversight',
        note: 'Controlled feedback will create a new engineering baseline.',
      },
      MEMBER: {
        state: 'PLANNED',
        scope: 'Assigned project role',
        note: 'Access will follow project responsibility.',
      },
      CUSTOMER: {
        state: 'PLANNED',
        scope: 'Submit and track',
        note: 'Limited to the customer’s invited project and permitted records.',
      },
    },
  },
]

const STATE_STYLE: Record<
  AccessState,
  { label: string; icon: LucideIcon; className: string; rail: string }
> = {
  PRIVATE: {
    label: 'Private',
    icon: Briefcase,
    className:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/30 dark:text-violet-300',
    rail: 'bg-violet-500',
  },
  SHARED: {
    label: 'Shared',
    icon: Users,
    className:
      'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/70 dark:bg-cyan-950/30 dark:text-cyan-300',
    rail: 'bg-cyan-500',
  },
  RESTRICTED: {
    label: 'Restricted',
    icon: Folder,
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300',
    rail: 'bg-amber-500',
  },
  ADMIN_ONLY: {
    label: 'Admin only',
    icon: ShieldCheck,
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300',
    rail: 'bg-emerald-500',
  },
  NONE: {
    label: 'No access',
    icon: Ban,
    className:
      'border-stone-200 bg-stone-100 text-stone-500 dark:border-fmea-border dark:bg-fmea-bg3 dark:text-fmea-dim',
    rail: 'bg-stone-300 dark:bg-fmea-border',
  },
  PLANNED: {
    label: 'Planned',
    icon: Clock3,
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300',
    rail: 'bg-amber-400',
  },
}

export function AccessBoundaryMap() {
  const [persona, setPersona] = useState<Persona>('ADMIN')
  const selectedPersona = PERSONAS.find((option) => option.id === persona)!
  const SelectedPersonaIcon = selectedPersona.icon

  return (
    <section className="mb-10 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-fmea-border dark:bg-fmea-bg2">
      <div className="border-b border-stone-100 p-5 dark:border-fmea-border sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-fmea-accent">
              <ShieldCheck className="h-4 w-4" />
              Access boundary
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-fmea-hi">
              Who can see what?
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-fmea-dim">
              Select a user perspective to inspect the current and planned information boundary.
            </p>
          </div>

          <div
            className="grid grid-cols-3 rounded-2xl border border-stone-200 bg-stone-50 p-1 dark:border-fmea-border dark:bg-fmea-bg3"
            aria-label="Select access perspective"
          >
            {PERSONAS.map((option) => {
              const Icon = option.icon
              const isSelected = option.id === persona
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPersona(option.id)}
                  aria-pressed={isSelected}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-white text-cyan-800 shadow-sm dark:bg-fmea-bg2 dark:text-fmea-accent'
                      : 'text-stone-500 hover:text-slate-900 dark:text-fmea-dim dark:hover:text-fmea-hi'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">{option.shortLabel}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-stone-50/70 p-5 dark:bg-fmea-bg/30 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-fmea-accent dark:text-fmea-bg">
            <SelectedPersonaIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400 dark:text-fmea-dim">
              Viewing as
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-fmea-hi">
              {selectedPersona.label}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {ZONES.map((zone) => {
            const ZoneIcon = zone.icon
            const rule = zone.access[persona]
            const style = STATE_STYLE[rule.state]
            const StateIcon = style.icon

            return (
              <article
                key={zone.id}
                className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-fmea-border dark:bg-fmea-bg2"
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${style.rail}`} />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-slate-600 dark:bg-fmea-bg3 dark:text-fmea-dim">
                    <ZoneIcon className="h-4 w-4" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${style.className}`}
                  >
                    <StateIcon className="h-3 w-3" />
                    {style.label}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-950 dark:text-fmea-hi">
                  {zone.label}
                </h3>
                <p className="mt-1 text-xs text-stone-400 dark:text-fmea-dim">
                  {zone.description}
                </p>
                <div className="mt-4 border-t border-stone-100 pt-3 dark:border-fmea-border">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {rule.state !== 'NONE' && rule.state !== 'PLANNED' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : rule.state === 'PLANNED' ? (
                      <Clock3 className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <Ban className="h-3.5 w-3.5 text-stone-400" />
                    )}
                    {rule.scope}
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-fmea-dim">
                    {rule.note}
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        {persona === 'CUSTOMER' && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-amber-200">
            <Ban className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Customer accounts are not enabled today</p>
              <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300">
                Stage 7 must introduce project-level permissions before any external account is
                created. A customer will never be added to the trusted internal workspace.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
