import type {
  Transcription,
  Category,
  Summary,
  TranscriptionSegment as PrismaSegment,
  AudioEvent as PrismaAudioEvent,
  TranscriptionVersion as PrismaVersion,
  DerivedContent as PrismaDerivedContent,
} from '@prisma/client'
import type { HistoryItem, HistoryCategory } from '@/features/history/types'
import type { SummaryData } from '@/features/summary/types'
import type { TranscriptionSegment } from '@/features/transcription/types'
import type { AudioEvent } from '@/features/history/types/events'
import type { VersionSummary, VersionDetail } from '@/features/history/types/versions'
import type { DerivedContentData } from '@/features/history/types/derivedContent'

type TranscriptionWithRelations = Transcription & {
  category: Category | null
  summary: Summary | null
  segments?: PrismaSegment[]
  events?: PrismaAudioEvent[]
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
    hasEvents: t.hasEvents,
    originalTranscription: t.originalTranscriptionText ?? undefined,
    currentVersion: t.currentVersion,
    source: (t.source as 'upload' | 'realtime') ?? 'upload',
  }
}

export function mapSegments(segments: PrismaSegment[]): TranscriptionSegment[] {
  return segments.map((s) => ({
    id: s.id,
    index: s.index,
    speaker: s.speaker,
    text: s.text,
    originalText: s.originalText ?? undefined,
    speakerLabel: s.speakerLabel ?? undefined,
    startTime: s.startTime,
    endTime: s.endTime,
  }))
}

export function mapEvents(events: PrismaAudioEvent[]): AudioEvent[] {
  return events.map((e) => ({
    id: e.id,
    type: e.type as AudioEvent['type'],
    startTime: e.startTime,
    endTime: e.endTime,
    confidence: e.confidence,
    description: e.description ?? undefined,
    source: e.source,
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

export function mapVersionToSummary(v: PrismaVersion): VersionSummary {
  return {
    id: v.id,
    versionNumber: v.versionNumber,
    editedAt: v.editedAt.toISOString(),
    changesSummary: v.changesSummary,
    editorId: v.editorId ?? undefined,
  }
}

export function mapVersionToDetail(v: PrismaVersion): VersionDetail {
  return {
    id: v.id,
    versionNumber: v.versionNumber,
    editedAt: v.editedAt.toISOString(),
    changesSummary: v.changesSummary,
    editorId: v.editorId ?? undefined,
    snapshot: v.snapshot as unknown as VersionDetail['snapshot'],
  }
}

export function mapDerivedContent(d: PrismaDerivedContent): DerivedContentData {
  return {
    id: d.id,
    transcriptionId: d.transcriptionId,
    type: d.type,
    title: d.title,
    content: d.content,
    tokensUsed: d.tokensUsed,
    modelUsed: d.modelUsed,
    metadata: d.metadata as Record<string, unknown> | null,
    createdAt: d.createdAt.toISOString(),
  }
}
