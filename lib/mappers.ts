import type {
  Transcription,
  Category,
  Summary,
} from '@prisma/client'
import type { HistoryItem, HistoryCategory } from '@/features/history/types'
import type { SummaryData } from '@/features/summary/types'

type TranscriptionWithRelations = Transcription & {
  category: Category | null
  summary: Summary | null
}

export function mapTranscriptionToHistoryItem(
  t: TranscriptionWithRelations
): HistoryItem {
  return {
    id: t.id,
    fileName: t.fileName,
    originalFileName: t.originalFileName,
    fileSize: t.fileSize,
    duration: t.duration ?? undefined,
    transcription: t.transcription,
    summary: t.summary ? mapSummaryToSummaryData(t.summary) : undefined,
    category: t.categoryId ?? undefined,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    hasAudio: t.hasAudio,
    audioMimeType: t.audioMimeType ?? undefined,
  }
}

export function mapSummaryToSummaryData(s: Summary): SummaryData {
  return {
    summary: s.summary,
    insights: s.insights,
    tokensUsed: s.tokensUsed,
    generatedAt: s.generatedAt,
  }
}

export function mapCategoryToHistoryCategory(c: Category): HistoryCategory {
  return {
    id: c.id,
    name: c.name,
    color: c.color,
  }
}
