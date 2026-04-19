'use client'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Greeting({ name, dateString }: { name: string; dateString: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">
        {getGreeting()}, {name}
      </h1>
      <p className="text-sm text-slate-500 dark:text-fmea-dim mt-0.5">{dateString}</p>
    </div>
  )
}
