'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09141f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#0e1e2e',
        border: '1px solid #1c3550',
        borderRadius: '12px',
        padding: '2.5rem',
        boxShadow: '0 4px 40px rgba(0,0,0,.7)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#00d4e8',
            marginBottom: '0.5rem',
          }}>
            Engineering Consultant
          </div>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: '600',
            color: '#f0faff',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            SoloCRM
          </h1>
          <p style={{
            color: '#5c85a0',
            fontSize: '0.85rem',
            marginTop: '0.4rem',
            fontWeight: '300',
          }}>
            Sign in to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontFamily: 'DM Mono, monospace',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#5c85a0',
              marginBottom: '0.5rem',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#09141f',
                border: `1px solid ${error ? '#ff3d2e' : '#1c3550'}`,
                borderRadius: '8px',
                color: '#d0e8f8',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={(e) => { if (!error) e.target.style.borderColor = '#00d4e8' }}
              onBlur={(e) => { if (!error) e.target.style.borderColor = '#1c3550' }}
            />
          </div>

          {error && (
            <p style={{
              color: '#ff6b6b',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              background: 'rgba(255,50,30,.10)',
              border: '1px solid rgba(255,60,40,.25)',
              borderRadius: '6px',
              padding: '0.6rem 0.85rem',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '0.8rem',
              background: loading || !password ? '#142840' : '#00d4e8',
              color: loading || !password ? '#5c85a0' : '#09141f',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.75rem',
          color: '#5c85a0',
          fontFamily: 'DM Mono, monospace',
          letterSpacing: '0.05em',
        }}>
          Private access — Fraser Mackie
        </p>
      </div>
    </div>
  )
}
