export type RecordingPhase =
  | 'idle'
  | 'requesting-permission'
  | 'connecting'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'completed'
  | 'error'

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'requesting'

export interface RealtimeSegment {
  index: number
  text: string
  isFinal: boolean
  startTime: number
  endTime: number
}

export interface RecordingResult {
  audioBlob: Blob
  mimeType: string
  duration: number
  segments: RealtimeSegment[]
  fullText: string
}
