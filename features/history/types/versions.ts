export interface VersionSummary {
  id: string
  versionNumber: number
  editedAt: string
  changesSummary: string
  editorId?: string
}

export interface VersionSnapshot {
  transcriptionText: string
  segments: Array<{
    index: number
    speaker: string
    speakerLabel: string | null
    text: string
    originalText: string | null
    startTime: number
    endTime: number
  }>
  events: Array<{
    type: string
    startTime: number
    endTime: number
    confidence: number
    description: string | null
    source: string
  }>
}

export interface VersionDetail extends VersionSummary {
  snapshot: VersionSnapshot
}

export type LocalVersion = VersionDetail
