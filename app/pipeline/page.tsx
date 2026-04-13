'use client'

import { useEffect, useState } from 'react'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { OpportunityStage } from '@prisma/client'

interface Opportunity {
  id: string
  title: string
  stage: OpportunityStage
  company?: { name: string } | null
  estimatedValue?: number | null
  probabilityPercent?: number | null
}

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    try {
      const res = await fetch('/api/opportunities')
      const data = await res.json()
      setOpportunities(data)
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-fmea-hi">Pipeline</h1>
        <p className="text-slate-600 dark:text-fmea-dim mt-1">Manage your sales pipeline by stage</p>
      </div>

      <KanbanBoard
        opportunities={opportunities}
        onNewOpportunity={(stage) => {
          window.location.href = `/opportunities?action=new&stage=${stage}`
        }}
      />
    </div>
  )
}
