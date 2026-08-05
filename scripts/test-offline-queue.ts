import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import {
  clearLastKnowledgeUser,
  countKnowledgeCaptures,
  enqueueKnowledgeCapture,
  getKnowledgeDraft,
  getLastKnowledgeUser,
  listKnowledgeCaptures,
  markKnowledgeCaptureAttempt,
  removeKnowledgeCapture,
  saveKnowledgeDraft,
  setLastKnowledgeUser,
  type OfflineKnowledgeCapture,
} from '../lib/offline-knowledge'

async function run() {
  const primaryUser = 'user-primary'
  const otherUser = 'user-other'

  await setLastKnowledgeUser(primaryUser)
  assert.equal(await getLastKnowledgeUser(), primaryUser)

  await saveKnowledgeDraft(primaryUser, 'Draft retained between app launches', 'WISDOM')
  const retainedDraft = await getKnowledgeDraft(primaryUser)
  assert.equal(retainedDraft.content, 'Draft retained between app launches')
  assert.equal(retainedDraft.knowledgeType, 'WISDOM')
  assert.equal((await getKnowledgeDraft(otherUser)).content, '')

  const firstCapture: OfflineKnowledgeCapture = {
    id: '20000000-0000-4000-8000-000000000001',
    ownerUserId: primaryUser,
    content: 'First offline note',
    knowledgeType: 'WISDOM',
    createdAt: '2026-07-29T10:00:00.000Z',
    attempts: 0,
    lastAttemptAt: null,
    lastError: null,
  }
  const secondCapture: OfflineKnowledgeCapture = {
    ...firstCapture,
    id: '20000000-0000-4000-8000-000000000002',
    content: 'Second offline note',
    createdAt: '2026-07-29T10:01:00.000Z',
  }
  const otherUserCapture: OfflineKnowledgeCapture = {
    ...firstCapture,
    id: '20000000-0000-4000-8000-000000000003',
    ownerUserId: otherUser,
    content: 'Another user’s note',
  }

  await enqueueKnowledgeCapture(secondCapture)
  await enqueueKnowledgeCapture(otherUserCapture)
  await enqueueKnowledgeCapture(firstCapture)

  assert.equal(await countKnowledgeCaptures(primaryUser), 2)
  assert.equal(await countKnowledgeCaptures(otherUser), 1)

  const primaryQueue = await listKnowledgeCaptures(primaryUser)
  assert.deepEqual(
    primaryQueue.map((capture) => capture.id),
    [firstCapture.id, secondCapture.id],
    'Captures should remain ordered by their original device time'
  )
  assert.ok(
    primaryQueue.every((capture) => capture.ownerUserId === primaryUser),
    'One user must never receive another user’s device queue'
  )
  assert.equal(primaryQueue[0].knowledgeType, 'WISDOM')

  await markKnowledgeCaptureAttempt(firstCapture, 'Network unavailable')
  const retried = (await listKnowledgeCaptures(primaryUser))[0]
  assert.equal(retried.attempts, 1)
  assert.equal(retried.lastError, 'Network unavailable')
  assert.ok(retried.lastAttemptAt)

  await removeKnowledgeCapture(firstCapture.id)
  assert.equal(await countKnowledgeCaptures(primaryUser), 1)

  await saveKnowledgeDraft(primaryUser, '')
  assert.equal((await getKnowledgeDraft(primaryUser)).content, '')
  assert.equal((await getKnowledgeDraft(primaryUser)).knowledgeType, null)

  await clearLastKnowledgeUser()
  assert.equal(await getLastKnowledgeUser(), null)

  console.log('Offline Knowledge queue tests passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
