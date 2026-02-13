import type {
  Transcription,
  Category,
  Summary,
  TranscriptionSegment as PrismaSegment,
} from '@prisma/client'
import type { HistoryItem, HistoryCategory } from '@/features/history/types'
import type { SummaryData } from '@/features/summary/types'
import type { TranscriptionSegment } from '@/features/transcription/types'

type TranscriptionWithRelations = Transcription & {
  category: Category | null
  summary: Summary | null
  segments?: PrismaSegment[]
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
    hasDiarization: t.hasDiarization,
    speakerCount: t.speakerCount ?? undefined,
  }
}

export function mapSegments(segments: PrismaSegment[]): TranscriptionSegment[] {
  return segments.map((s) => ({
    id: s.id,
    index: s.index,
    speaker: s.speaker,
    text: s.text,
    startTime: s.startTime,
    endTime: s.endTime,
  }))
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
