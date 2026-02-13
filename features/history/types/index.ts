import type { SummaryData } from '@/features/summary/types'
import type { TranscriptionSegment } from '@/features/transcription/types'

export interface HistoryItem {
  id: string
  fileName: string
  originalFileName: string
  fileSize: number
  duration?: number
  transcription: string
  summary?: SummaryData
  category?: string
  createdAt: string
  updatedAt: string
  hasAudio?: boolean
  audioMimeType?: string
  hasDiarization?: boolean
  speakerCount?: number
  segments?: TranscriptionSegment[]
}

export interface HistoryCategory {
  id: string
  name: string
  color: string
}

export type SortBy = 'date' | 'name' | 'size'
export type SortOrder = 'asc' | 'desc'

export interface HistoryFilters {
  search: string
  category?: string
  sortBy: SortBy
  sortOrder: SortOrder
  dateRange?: {
    start: string
    end: string
  }
}

export interface HistoryState {
  items: HistoryItem[]
  categories: HistoryCategory[]
}
