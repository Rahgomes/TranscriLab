export type AudioEventType = 'LAUGHTER' | 'APPLAUSE' | 'MUSIC' | 'SILENCE' | 'CROSSTALK' | 'OTHER'

export interface AudioEvent {
  id?: string
  type: AudioEventType
  startTime: number
  endTime: number
  confidence: number
  description?: string
  source: string
}
