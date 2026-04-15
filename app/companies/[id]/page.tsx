'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { INDUSTRY_LABELS, COMPANY_TYPE_LABELS, REGULATORY_FRAMEWORK_LABELS } from '@/lib/constants'
import { Badge } from '@/components/shared/badge'
import { ArrowLeft, Edit2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { NotesSection } from '@/components/shared/notes-section'

interface Company {
  id: string
  name: string
  website?: string | null
  country?: string | null
  city?: string | null
  industry?: string | null
  companyType?: string | null
  regulatoryEnvironment?: string[]
  notes?: string | null
  _count: {
    contacts: number
    opportunities: number
  }
}

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchCompany()
    }
  }, [params.id])

  const fetchCompany = async () => {
    try {
      const res = await fetch(`/api/companies/${params.id}`)
      if (!res.ok) throw new Error('Company not found')
      const data = await res.json()
      setCompany(data)
    } catch (error) {
      console.error('Error fetching company:', error)
      router.push('/companies')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!company) {
    return <div className="text-center py-12">Company not found</div>
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{company.name}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {company.city && company.country ? `${company.city}, ${company.country}` : company.country || ''}
          </p>
        </div>
        <Link
          href={`/companies/${company.id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <Edit2 className="h-5 w-5" />
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Overview</h2>

            <div className="space-y-4">
              {company.industry && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Industry</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {INDUSTRY_LABELS[company.industry as any]}
                  </p>
                </div>
              )}

              {company.companyType && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Company Type</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {COMPANY_TYPE_LABELS[company.companyType as any]}
                  </p>
                </div>
              )}

              {company.website && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Website</p>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    {company.website}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              {company.regulatoryEnvironment && company.regulatoryEnvironment.length > 0 && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Regulatory Environment</p>
                  <div className="flex flex-wrap gap-2">
                    {company.regulatoryEnvironment.map((reg) => (
                      <Badge
                        key={reg}
                        label={REGULATORY_FRAMEWORK_LABELS[reg as any] || reg}
                        color="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          <NotesSection companyId={company.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Statistics</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Contacts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{company._count.contacts}</p>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">Opportunities</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{company._count.opportunities}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
