import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BookOpen,
  Briefcase,
  Building2,
  CheckSquare,
  Kanban,
  LayoutDashboard,
  Target,
  Users,
  Zap,
  Milestone,
} from 'lucide-react'

export interface NavigationItem {
  href: string
  icon: LucideIcon
  label: string
}

export interface NavigationSection {
  label: 'Knowledge' | 'Enquiries' | 'Analysis' | 'Development'
  items: NavigationItem[]
  adminOnly?: boolean
}

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    label: 'Knowledge',
    items: [
      { href: '/knowledge', icon: BookOpen, label: 'Knowledge' },
    ],
  },
  {
    label: 'Enquiries',
    items: [
      { href: '/pipeline', icon: Kanban, label: 'Pipeline' },
      { href: '/opportunities', icon: Target, label: 'Opportunities' },
      { href: '/contacts', icon: Users, label: 'Contacts' },
      { href: '/companies', icon: Building2, label: 'Companies' },
      { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
      { href: '/activities', icon: Activity, label: 'Activities' },
      { href: '/quick-capture', icon: Zap, label: 'Enquiry Capture' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/procurement', icon: Briefcase, label: 'Procurement' },
    ],
  },
  {
    label: 'Development',
    adminOnly: true,
    items: [{ href: '/development', icon: Milestone, label: 'Roadmap' }],
  },
]
