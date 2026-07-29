'use client'

import { useEffect, useState } from 'react'
import { Shield, Plus, Pencil, Ban, Key, Users, Check, X, Download } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'MEMBER'
  isActive: boolean
  createdAt: string
}

interface FormState {
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'MEMBER'
}

const BLANK: FormState = { name: '', email: '', password: '', role: 'MEMBER' }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [resetId, setResetId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(BLANK)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  const handleDownloadBackup = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/admin/backup')
      if (!res.ok) throw new Error('Backup failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reference-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert('Backup download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.email || !form.password) { setError('Email and password are required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      await fetchUsers()
      setShowCreate(false)
      setForm(BLANK)
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to create user')
    }
    setSaving(false)
  }

  const handleUpdate = async (id: string) => {
    setSaving(true); setError('')
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, role: form.role }),
    })
    if (res.ok) { await fetchUsers(); setEditId(null) }
    else { const d = await res.json(); setError(d.error || 'Failed to update') }
    setSaving(false)
  }

  const handleResetPassword = async (id: string) => {
    if (!newPassword) return
    setSaving(true)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    if (res.ok) { setResetId(null); setNewPassword('') }
    setSaving(false)
  }

  const handleDeactivate = async (id: string) => {
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    fetchUsers()
  }

  const handleReactivate = async (id: string) => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    })
    fetchUsers()
  }

  const startEdit = (u: User) => {
    setForm({ name: u.name || '', email: u.email, password: '', role: u.role })
    setEditId(u.id)
    setShowCreate(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-600 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-fmea-hi">Team Users</h1>
            <p className="text-sm text-slate-500 dark:text-fmea-dim">Manage access to Reference</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBackup}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-fmea-bg3 text-slate-700 dark:text-fmea-text text-sm font-medium hover:bg-slate-200 dark:hover:bg-fmea-border transition-colors disabled:opacity-50"
            title="Download a workspace backup as JSON"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Preparing…' : 'Backup'}
          </button>
          <button
            onClick={() => { setShowCreate(true); setEditId(null); setForm(BLANK); setError('') }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-violet-600 rounded-xl p-4 text-white">
          <Users className="h-4 w-4 text-white/70 mb-1" />
          <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
          <p className="text-xs text-white/80 mt-0.5">Active Users</p>
        </div>
        <div className="bg-indigo-600 rounded-xl p-4 text-white">
          <Shield className="h-4 w-4 text-white/70 mb-1" />
          <p className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</p>
          <p className="text-xs text-white/80 mt-0.5">Admins</p>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-violet-200 dark:border-violet-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-fmea-hi uppercase tracking-wide">New User</h2>
          {error && <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-violet-500" />
            <input placeholder="Email *" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-violet-500" />
            <input type="password" placeholder="Password *" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-violet-500" />
            <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value as 'ADMIN' | 'MEMBER'}))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors">
              {saving ? 'Creating…' : 'Create User'}
            </button>
            <button onClick={() => { setShowCreate(false); setError('') }}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-fmea-dim text-sm hover:bg-slate-100 dark:hover:bg-fmea-bg3 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : (
        <div className="bg-white dark:bg-fmea-bg2 rounded-xl border border-slate-200 dark:border-fmea-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-fmea-bg3 border-b border-slate-200 dark:border-fmea-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-fmea-dim uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-fmea-border">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-fmea-bg3 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                  {editId === u.id ? (
                    <>
                      <td className="px-4 py-3" colSpan={3}>
                        <div className="flex gap-2">
                          <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Name"
                            className="px-2 py-1 rounded border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text w-32 focus:outline-none" />
                          <input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="Email"
                            className="px-2 py-1 rounded border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text w-48 focus:outline-none" />
                          <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value as 'ADMIN' | 'MEMBER'}))}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-sm dark:text-fmea-text focus:outline-none">
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleUpdate(u.id)} className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditId(null)} className="p-1.5 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-fmea-bg3"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-fmea-text">{u.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-fmea-dim">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'bg-slate-100 text-slate-600 dark:bg-fmea-bg3 dark:text-fmea-dim'}`}>
                          {u.role === 'ADMIN' ? '⬡ Admin' : 'Member'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEdit(u)} title="Edit" className="p-1.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => { setResetId(u.id); setNewPassword('') }} title="Reset password" className="p-1.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"><Key className="h-4 w-4" /></button>
                          {u.isActive
                            ? <button onClick={() => handleDeactivate(u.id)} title="Deactivate" className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><Ban className="h-4 w-4" /></button>
                            : <button onClick={() => handleReactivate(u.id)} title="Reactivate" className="p-1.5 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"><Check className="h-4 w-4" /></button>
                          }
                        </div>
                        {resetId === u.id && (
                          <div className="mt-2 flex gap-1">
                            <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                              className="px-2 py-1 rounded border border-slate-300 dark:border-fmea-border bg-white dark:bg-fmea-bg3 text-xs dark:text-fmea-text w-32 focus:outline-none" />
                            <button onClick={() => handleResetPassword(u.id)} className="px-2 py-1 rounded bg-amber-500 text-white text-xs hover:bg-amber-600">Set</button>
                            <button onClick={() => setResetId(null)} className="px-2 py-1 rounded text-slate-400 text-xs hover:bg-slate-100 dark:hover:bg-fmea-bg3"><X className="h-3 w-3" /></button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
