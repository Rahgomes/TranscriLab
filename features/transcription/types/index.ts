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

export interface TranscriptionResult {
  text: string
  duration?: number
  language?: string
}
