'use client'

import { INDUSTRY_LABELS, COMPANY_TYPE_LABELS } from '@/lib/constants'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  industry?: string | null
  companyType?: string | null
  country?: string | null
  _count: {
    contacts: number
    opportunities: number
  }
}

interface CompanyListProps {
  companies: Company[]
}

export function CompanyList({ companies }: CompanyListProps) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">No companies found</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-fmea-bg2 rounded-lg shadow-sm border border-slate-200 dark:border-fmea-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-fmea-bg3 border-b border-slate-200 dark:border-fmea-border">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
              Name
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
              Industry
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
              Type
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
              Country
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
              Contacts
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-fmea-text">
              Opportunities
            </th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company, idx) => (
            <tr
              key={company.id}
              className={`border-b border-slate-200 dark:border-fmea-border hover:bg-slate-50 dark:hover:bg-fmea-bg3 transition-colors ${
                idx === companies.length - 1 ? 'border-0' : ''
              }`}
            >
              <td className="px-6 py-4">
                <Link
                  href={`/companies/${company.id}`}
                  className="text-sm font-medium text-indigo-600 dark:text-fmea-accent hover:text-indigo-700 dark:hover:text-fmea-accent"
                >
                  {company.name}
                </Link>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 dark:text-fmea-dim">
                {company.industry ? INDUSTRY_LABELS[company.industry as any] : '—'}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 dark:text-fmea-dim">
                {company.companyType ? COMPANY_TYPE_LABELS[company.companyType as any] : '—'}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 dark:text-fmea-dim">
                {company.country || '—'}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-fmea-text">
                {company._count.contacts}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-fmea-text">
                {company._count.opportunities}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
