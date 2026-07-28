'use client'

import { FormEvent, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpen, Briefcase, Loader2, LockKeyhole, Search } from 'lucide-react'

const WORKSPACE_AREAS = [
  { icon: BookOpen, label: 'Knowledge' },
  { icon: Briefcase, label: 'Enquiries' },
  { icon: Search, label: 'Analysis' },
] as const

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        router.push('/knowledge')
        return
      }

      setError('Invalid email or password.')
      setLoading(false)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f6f2] text-slate-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(8,145,178,0.09),transparent_30%),radial-gradient(circle_at_90%_85%,rgba(15,23,42,0.05),transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]"
      />

      <main className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:gap-20 lg:px-12 lg:py-12">
        <section className="flex flex-col justify-between lg:min-h-[38rem] lg:py-3">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/reference-icon.png"
                alt=""
                width={56}
                height={56}
                priority
                className="h-12 w-12 rounded-xl shadow-sm sm:h-14 sm:w-14"
              />
              <div>
                <p className="text-xl font-semibold tracking-tight text-slate-950">Reference</p>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-cyan-800">
                  Private consulting workspace
                </p>
              </div>
            </div>

            <div className="mt-12 max-w-2xl sm:mt-16 lg:mt-28">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
                Working memory, without the overhead
              </p>
              <h1 className="text-4xl font-semibold leading-[1.06] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                Record what would be annoying to rediscover.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                One quiet place for useful knowledge, incoming work, decisions, projects, and the
                analysis behind them.
              </p>
            </div>
          </div>

          <div className="mt-10 hidden items-center gap-7 border-t border-slate-300/70 pt-6 text-sm text-slate-500 sm:flex lg:mt-16">
            {WORKSPACE_AREAS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-cyan-700" aria-hidden="true" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full lg:justify-self-end">
          <div className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.32)] backdrop-blur sm:p-9 lg:max-w-md">
            <div className="mb-8">
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100">
                <LockKeyhole className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to your private workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  inputMode="email"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-800 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-900 focus:outline-none focus:ring-4 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                )}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-200 pt-6 text-xs text-slate-400">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Private workspace · Authorised access only</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
