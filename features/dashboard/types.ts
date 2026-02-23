export type ApiProvider = 'OPENAI' | 'GROQ'
export type ApiOperation = 'TRANSCRIPTION' | 'SUMMARY' | 'DERIVED_CONTENT' | 'CHAT'

export interface UsageRecord {
  id: string
  provider: ApiProvider
  operation: ApiOperation
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  audioDuration: number | null
  estimatedCost: number
  createdAt: string
}

export interface UsageSummary {
  provider: ApiProvider
  totalRequests: number
  totalTokens: number
  totalAudioMinutes: number
  totalCost: number
  byOperation: {
    operation: ApiOperation
    count: number
    tokens: number
    cost: number
  }[]
  byModel: {
    model: string
    count: number
    tokens: number
    cost: number
  }[]
}

export interface DailyUsage {
  date: string
  provider: ApiProvider
  requests: number
  tokens: number
  audioMinutes: number
  cost: number
}

export interface UsageFilters {
  provider?: ApiProvider
  startDate?: string
  endDate?: string
  operation?: ApiOperation
}

export const PROVIDER_LABELS: Record<ApiProvider, string> = {
  OPENAI: 'OpenAI',
  GROQ: 'Groq',
}

export const OPERATION_LABELS: Record<ApiOperation, string> = {
  TRANSCRIPTION: 'Transcrição',
  SUMMARY: 'Resumo',
  DERIVED_CONTENT: 'Conteúdo Derivado',
  CHAT: 'Chat',
}

export const PROVIDER_COLORS: Record<ApiProvider, string> = {
  OPENAI: '#10B981', // Green
  GROQ: '#F59E0B', // Amber
}
