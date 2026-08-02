'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { KnowledgeType } from '@prisma/client'
import {
  countKnowledgeCaptures,
  enqueueKnowledgeCapture,
  getKnowledgeDraft,
  getLastKnowledgeUser,
  listKnowledgeCaptures,
  markKnowledgeCaptureAttempt,
  removeKnowledgeCapture,
  requestPersistentOfflineStorage,
  saveKnowledgeDraft,
  setLastKnowledgeUser,
  type OfflineKnowledgeCapture,
} from '@/lib/offline-knowledge'

export interface SyncedKnowledgeNote {
  id: string
  title: string | null
  content: string
  knowledgeType: KnowledgeType | null
  sourceUrl: string | null
  capturedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export type OfflineQueueState =
  | 'INITIALISING'
  | 'READY'
  | 'SAVING_LOCAL'
  | 'SYNCING'
  | 'PENDING'
  | 'AUTH_REQUIRED'
  | 'ERROR'

function createCaptureId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`
}

export function useOfflineKnowledgeQueue(
  onSynced: (note: SyncedKnowledgeNote) => void
) {
  const [draft, setDraftState] = useState('')
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [queueState, setQueueState] = useState<OfflineQueueState>('INITIALISING')
  const [statusDetail, setStatusDetail] = useState('Preparing secure device storage…')
  const [draftLoaded, setDraftLoaded] = useState(false)
  const syncingRef = useRef(false)
  const onSyncedRef = useRef(onSynced)

  useEffect(() => {
    onSyncedRef.current = onSynced
  }, [onSynced])

  const updatePendingCount = useCallback(async (userId: string) => {
    const count = await countKnowledgeCaptures(userId)
    setPendingCount(count)
    return count
  }, [])

  const syncQueuedCaptures = useCallback(
    async (userId: string) => {
      if (syncingRef.current || !navigator.onLine) return
      syncingRef.current = true
      setQueueState('SYNCING')
      setStatusDetail('Synchronising locally saved notes…')

      try {
        const captures = await listKnowledgeCaptures(userId)
        for (const capture of captures) {
          let response: Response
          try {
            response = await fetch('/api/knowledge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: capture.content,
                clientCaptureId: capture.id,
                clientCreatedAt: capture.createdAt,
                ownerUserId: capture.ownerUserId,
              }),
            })
          } catch {
            await markKnowledgeCaptureAttempt(capture, 'Network unavailable')
            setQueueState('PENDING')
            setStatusDetail('Saved on this device — waiting for a connection')
            break
          }

          const data = await response.json().catch(() => null)
          if (response.ok && data) {
            await removeKnowledgeCapture(capture.id)
            onSyncedRef.current(data as SyncedKnowledgeNote)
            continue
          }

          const message =
            data && typeof data.error === 'string' ? data.error : 'Server did not accept the note'
          await markKnowledgeCaptureAttempt(capture, message)
          if (response.status === 401 || response.status === 403) {
            setQueueState('AUTH_REQUIRED')
            setStatusDetail('Saved locally — sign in to complete synchronisation')
          } else {
            setQueueState('PENDING')
            setStatusDetail('Saved locally — synchronisation will retry')
          }
          break
        }

        const remaining = await updatePendingCount(userId)
        if (remaining === 0) {
          setQueueState('READY')
          setStatusDetail('Device queue clear — all captures are safely synchronised')
        }
      } catch (error) {
        console.error('[OFFLINE_KNOWLEDGE_SYNC]', error)
        setQueueState('ERROR')
        setStatusDetail('Device storage needs attention before another capture')
      } finally {
        syncingRef.current = false
      }
    },
    [updatePendingCount]
  )

  const initialise = useCallback(async () => {
    const online = navigator.onLine
    setIsOnline(online)

    try {
      let userId: string | null = null
      if (online) {
        try {
          const response = await fetch('/api/auth/me', { cache: 'no-store' })
          if (response.ok) {
            const user = await response.json()
            if (typeof user.id === 'string') {
              const authenticatedUserId = user.id
              userId = authenticatedUserId
              await setLastKnowledgeUser(authenticatedUserId)
            }
          } else if (response.status === 401) {
            setQueueState('AUTH_REQUIRED')
            setStatusDetail('Sign in to activate this device’s capture queue')
          } else {
            setQueueState('ERROR')
            setStatusDetail('Unable to confirm the signed-in user — capture text remains here')
          }
        } catch {
          userId = await getLastKnowledgeUser()
        }
      } else {
        userId = await getLastKnowledgeUser()
      }

      if (!userId) {
        setDraftLoaded(true)
        if (!online) {
          setQueueState('AUTH_REQUIRED')
          setStatusDetail('Connect and sign in once to activate offline capture')
        }
        return
      }

      setOwnerUserId(userId)
      const [storedDraft, count] = await Promise.all([
        getKnowledgeDraft(userId),
        countKnowledgeCaptures(userId),
      ])
      setDraftState((current) => current || storedDraft)
      setDraftLoaded(true)
      setPendingCount(count)

      if (!online) {
        setQueueState('PENDING')
        setStatusDetail(
          count
            ? `${count} ${count === 1 ? 'capture' : 'captures'} safely waiting on this device`
            : 'Offline capture ready — notes will stay on this device until connected'
        )
      } else if (count) {
        await syncQueuedCaptures(userId)
      } else {
        setQueueState('READY')
        setStatusDetail('Offline capture ready — device queue is clear')
      }
    } catch (error) {
      console.error('[OFFLINE_KNOWLEDGE_INIT]', error)
      setDraftLoaded(true)
      setQueueState('ERROR')
      setStatusDetail('Offline device storage could not be opened')
    }
  }, [syncQueuedCaptures])

  useEffect(() => {
    void initialise()

    const handleOnline = () => {
      setIsOnline(true)
      void initialise()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setQueueState('PENDING')
      setStatusDetail('Offline capture ready — notes will sync when connected')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [initialise])

  useEffect(() => {
    if (!ownerUserId || !draftLoaded) return
    const timeout = window.setTimeout(() => {
      void saveKnowledgeDraft(ownerUserId, draft).catch((error) => {
        console.error('[OFFLINE_KNOWLEDGE_DRAFT]', error)
        setQueueState('ERROR')
        setStatusDetail('Draft could not be stored safely on this device')
      })
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [draft, draftLoaded, ownerUserId])

  const queueCapture = useCallback(async () => {
    const content = draft.trim()
    if (!content) return false
    if (!ownerUserId) {
      setQueueState('AUTH_REQUIRED')
      setStatusDetail('Connect and sign in once before capturing offline')
      return false
    }
    if (content.length > 100_000) {
      setQueueState('ERROR')
      setStatusDetail('This capture is too large to save')
      return false
    }

    setQueueState('SAVING_LOCAL')
    setStatusDetail('Securing note on this device…')
    try {
      void requestPersistentOfflineStorage()
      const capture: OfflineKnowledgeCapture = {
        id: createCaptureId(),
        ownerUserId,
        content,
        createdAt: new Date().toISOString(),
        attempts: 0,
        lastAttemptAt: null,
        lastError: null,
      }
      await enqueueKnowledgeCapture(capture)
      await saveKnowledgeDraft(ownerUserId, '')
      setDraftState('')
      const count = await updatePendingCount(ownerUserId)
      setQueueState('PENDING')
      setStatusDetail(
        navigator.onLine
          ? 'Saved on this device — synchronising now'
          : `${count} ${count === 1 ? 'capture' : 'captures'} safely waiting on this device`
      )
      if (navigator.onLine) void syncQueuedCaptures(ownerUserId)
      return true
    } catch (error) {
      console.error('[OFFLINE_KNOWLEDGE_QUEUE]', error)
      setQueueState('ERROR')
      setStatusDetail('Could not secure this note locally — the text has not been cleared')
      return false
    }
  }, [draft, ownerUserId, syncQueuedCaptures, updatePendingCount])

  return {
    draft,
    setDraft: setDraftState,
    queueCapture,
    pendingCount,
    isOnline,
    queueState,
    statusDetail,
    ready: draftLoaded && Boolean(ownerUserId),
  }
}
