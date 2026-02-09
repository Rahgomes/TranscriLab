import type { HistoryCategory } from '../types'

export const HISTORY_STORAGE_KEY = 'audio-transcription-history'
export const CATEGORIES_STORAGE_KEY = 'audio-transcription-categories'

export const DEFAULT_CATEGORIES: HistoryCategory[] = [
  { id: 'work', name: 'Trabalho', color: '#3b82f6' },
  { id: 'personal', name: 'Pessoal', color: '#10b981' },
  { id: 'study', name: 'Estudos', color: '#8b5cf6' },
  { id: 'meeting', name: 'Reuniao', color: '#f59e0b' },
]

export const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]
