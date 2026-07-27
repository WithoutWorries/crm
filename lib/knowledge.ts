import type { KnowledgeType } from '@prisma/client'

export const KNOWLEDGE_TYPES = [
  'FACT',
  'DECISION',
  'SOLUTION',
  'LESSON_LEARNED',
  'IDEA',
  'QUESTION',
  'CALCULATION',
  'REFERENCE',
  'OBSERVATION',
] as const satisfies readonly KnowledgeType[]

export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeType, string> = {
  FACT: 'Fact',
  DECISION: 'Decision',
  SOLUTION: 'Solution',
  LESSON_LEARNED: 'Lesson learned',
  IDEA: 'Idea',
  QUESTION: 'Question',
  CALCULATION: 'Calculation',
  REFERENCE: 'Reference',
  OBSERVATION: 'Observation',
}

const KNOWLEDGE_TYPE_SET = new Set<string>(KNOWLEDGE_TYPES)

export const MAX_KNOWLEDGE_CONTENT_LENGTH = 100_000
export const MAX_KNOWLEDGE_TITLE_LENGTH = 200
export const MAX_SOURCE_URL_LENGTH = 2_048

export function isKnowledgeType(value: unknown): value is KnowledgeType {
  return typeof value === 'string' && KNOWLEDGE_TYPE_SET.has(value)
}

export function deriveKnowledgeTitle(content: string): string {
  const firstMeaningfulLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? 'Untitled note'

  const firstSentence = firstMeaningfulLine.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim()
  const candidate = firstSentence || firstMeaningfulLine

  if (candidate.length <= 88) return candidate
  return `${candidate.slice(0, 85).trimEnd()}…`
}

export function normalizeOptionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  if (!normalized) return null
  return normalized.slice(0, maxLength)
}

export function validateKnowledgeContent(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  if (!normalized || normalized.length > MAX_KNOWLEDGE_CONTENT_LENGTH) return null
  return normalized
}

export function normalizeSourceUrl(value: unknown): string | null {
  const normalized = normalizeOptionalText(value, MAX_SOURCE_URL_LENGTH)
  if (!normalized) return null

  try {
    const url = new URL(normalized)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function requestHasJsonContentType(request: Request): boolean {
  return request.headers.get('content-type')?.toLowerCase().includes('application/json') ?? false
}
