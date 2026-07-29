const DATABASE_NAME = 'reference-offline'
const DATABASE_VERSION = 1
const CAPTURE_STORE = 'knowledge-captures'
const DRAFT_STORE = 'knowledge-drafts'
const META_STORE = 'metadata'
const LAST_USER_KEY = 'last-knowledge-user'

export interface OfflineKnowledgeCapture {
  id: string
  ownerUserId: string
  content: string
  createdAt: string
  attempts: number
  lastAttemptAt: string | null
  lastError: string | null
}

interface OfflineKnowledgeDraft {
  ownerUserId: string
  content: string
  updatedAt: string
}

interface MetadataRecord {
  key: string
  value: string
}

let databasePromise: Promise<IDBDatabase> | null = null

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Local storage request failed'))
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Local storage transaction failed'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Local storage transaction was cancelled'))
  })
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Offline storage is unavailable in this browser'))
  }
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(CAPTURE_STORE)) {
        const store = database.createObjectStore(CAPTURE_STORE, { keyPath: 'id' })
        store.createIndex('ownerUserId', 'ownerUserId', { unique: false })
      }
      if (!database.objectStoreNames.contains(DRAFT_STORE)) {
        database.createObjectStore(DRAFT_STORE, { keyPath: 'ownerUserId' })
      }
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => {
      const database = request.result
      database.onversionchange = () => database.close()
      resolve(database)
    }
    request.onerror = () => {
      databasePromise = null
      reject(request.error ?? new Error('Unable to open offline storage'))
    }
    request.onblocked = () => {
      databasePromise = null
      reject(new Error('Offline storage upgrade is blocked by another app window'))
    }
  })

  return databasePromise
}

export async function setLastKnowledgeUser(userId: string): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(META_STORE, 'readwrite')
  transaction.objectStore(META_STORE).put({
    key: LAST_USER_KEY,
    value: userId,
  } satisfies MetadataRecord)
  await transactionComplete(transaction)
}

export async function getLastKnowledgeUser(): Promise<string | null> {
  const database = await openDatabase()
  const transaction = database.transaction(META_STORE, 'readonly')
  const record = await requestResult(
    transaction.objectStore(META_STORE).get(LAST_USER_KEY) as IDBRequest<
      MetadataRecord | undefined
    >
  )
  return record?.value ?? null
}

export async function clearLastKnowledgeUser(): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(META_STORE, 'readwrite')
  transaction.objectStore(META_STORE).delete(LAST_USER_KEY)
  await transactionComplete(transaction)
}

export async function saveKnowledgeDraft(ownerUserId: string, content: string): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(DRAFT_STORE, 'readwrite')
  const store = transaction.objectStore(DRAFT_STORE)
  if (content) {
    store.put({
      ownerUserId,
      content,
      updatedAt: new Date().toISOString(),
    } satisfies OfflineKnowledgeDraft)
  } else {
    store.delete(ownerUserId)
  }
  await transactionComplete(transaction)
}

export async function getKnowledgeDraft(ownerUserId: string): Promise<string> {
  const database = await openDatabase()
  const transaction = database.transaction(DRAFT_STORE, 'readonly')
  const draft = await requestResult(
    transaction.objectStore(DRAFT_STORE).get(ownerUserId) as IDBRequest<
      OfflineKnowledgeDraft | undefined
    >
  )
  return draft?.content ?? ''
}

export async function enqueueKnowledgeCapture(
  capture: OfflineKnowledgeCapture
): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(CAPTURE_STORE, 'readwrite')
  transaction.objectStore(CAPTURE_STORE).put(capture)
  await transactionComplete(transaction)
}

export async function listKnowledgeCaptures(
  ownerUserId: string
): Promise<OfflineKnowledgeCapture[]> {
  const database = await openDatabase()
  const transaction = database.transaction(CAPTURE_STORE, 'readonly')
  const store = transaction.objectStore(CAPTURE_STORE)
  const index = store.index('ownerUserId')
  const captures = await requestResult(
    index.getAll(IDBKeyRange.only(ownerUserId)) as IDBRequest<OfflineKnowledgeCapture[]>
  )
  return captures.sort((left, right) => left.createdAt.localeCompare(right.createdAt))
}

export async function removeKnowledgeCapture(id: string): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(CAPTURE_STORE, 'readwrite')
  transaction.objectStore(CAPTURE_STORE).delete(id)
  await transactionComplete(transaction)
}

export async function markKnowledgeCaptureAttempt(
  capture: OfflineKnowledgeCapture,
  error: string
): Promise<void> {
  await enqueueKnowledgeCapture({
    ...capture,
    attempts: capture.attempts + 1,
    lastAttemptAt: new Date().toISOString(),
    lastError: error.slice(0, 500),
  })
}

export async function countKnowledgeCaptures(ownerUserId: string): Promise<number> {
  const database = await openDatabase()
  const transaction = database.transaction(CAPTURE_STORE, 'readonly')
  return requestResult(
    transaction.objectStore(CAPTURE_STORE).index('ownerUserId').count(ownerUserId)
  )
}

export async function requestPersistentOfflineStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  try {
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
