import type { TranscriptionSegment } from '@/features/transcription/types'

export interface SpeakerInfo {
  id: string
  displayName: string
  color: string
  totalDuration: number
  segmentCount: number
}

export interface SegmentGroup {
  speaker: string
  segments: TranscriptionSegment[]
  startTime: number
  endTime: number
}
