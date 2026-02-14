import type { AudioEventType } from '@/features/history/types/events'

export interface EventTypeConfig {
  label: string
  color: string
  icon: string
}

export const EVENT_TYPE_CONFIG: Record<AudioEventType, EventTypeConfig> = {
  LAUGHTER: { label: 'Risos', color: '#f59e0b', icon: 'emoji_emotions' },
  APPLAUSE: { label: 'Aplausos', color: '#3b82f6', icon: 'celebration' },
  MUSIC: { label: 'Musica', color: '#8b5cf6', icon: 'music_note' },
  SILENCE: { label: 'Silencio', color: '#64748b', icon: 'volume_off' },
  CROSSTALK: { label: 'Sobreposicao', color: '#f43f5e', icon: 'record_voice_over' },
  OTHER: { label: 'Outro', color: '#a1a1aa', icon: 'radio_button_checked' },
} as const

export function getEventColor(type: AudioEventType): string {
  return EVENT_TYPE_CONFIG[type].color
}

export function getEventIcon(type: AudioEventType): string {
  return EVENT_TYPE_CONFIG[type].icon
}

export function getEventLabel(type: AudioEventType): string {
  return EVENT_TYPE_CONFIG[type].label
}
