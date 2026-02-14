export type FileStatus = 'pending' | 'uploading' | 'transcribing' | 'completed' | 'error'

export interface AudioFileState {
  id: string
  file: File
  name: string
  size: number
  status: FileStatus
  progress: number
  transcription?: string
  error?: string
  createdAt: Date
}

export interface TranscriptionSegment {
  id?: string
  index: number
  speaker: string
  text: string
  originalText?: string
  speakerLabel?: string
  startTime: number
  endTime: number
}

export interface TranscriptionResult {
  text: string
  duration?: number
  language?: string
  segments?: TranscriptionSegment[]
  speakerCount?: number
  hasDiarization?: boolean
  events?: import('@/features/history/types/events').AudioEvent[]
  hasEvents?: boolean
}
