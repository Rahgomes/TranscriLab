export type ExportFormat = 'pdf' | 'docx'

export interface ExportOptions {
  format: ExportFormat
  includeTimestamps: boolean
  includeSpeakerLabels: boolean
  includeSummary: boolean
  includeInsights: boolean
  includeMetadata: boolean
}

export interface ExportData {
  title: string
  createdAt: Date
  transcription: string
  segments?: {
    speaker: string
    speakerLabel?: string
    text: string
    startTime: number
    endTime: number
  }[]
  summary?: {
    summary: string
    insights: string[]
  }
  metadata?: {
    wordCount: number
    charCount: number
    duration?: number
    speakerCount?: number
  }
}

export const defaultExportOptions: ExportOptions = {
  format: 'pdf',
  includeTimestamps: true,
  includeSpeakerLabels: true,
  includeSummary: true,
  includeInsights: true,
  includeMetadata: true,
}
