'use client'

import { useEffect, useState } from 'react'

interface CurrentUser {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'MEMBER'
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data))
      .catch(() => {})
  }, [])

  return user
}
