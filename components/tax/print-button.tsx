'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-800 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-900">
      <Printer className="h-4 w-4" />Print or save PDF
    </button>
  )
}
