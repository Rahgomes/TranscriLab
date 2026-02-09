export class TranscriptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'TranscriptionError'
  }
}

export const ERROR_CODES = {
  NO_FILE: 'NO_FILE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  SUMMARY_FAILED: 'SUMMARY_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  API_ERROR: 'API_ERROR',
} as const

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NO_FILE]: 'Nenhum arquivo de áudio enviado',
  [ERROR_CODES.FILE_TOO_LARGE]: 'Arquivo muito grande (máx: 25MB)',
  [ERROR_CODES.INVALID_FORMAT]: 'Formato de arquivo não suportado',
  [ERROR_CODES.TRANSCRIPTION_FAILED]: 'Erro ao transcrever áudio',
  [ERROR_CODES.SUMMARY_FAILED]: 'Erro ao gerar resumo',
  [ERROR_CODES.NETWORK_ERROR]: 'Erro de conexão. Verifique sua internet.',
  [ERROR_CODES.RATE_LIMIT]: 'Limite de requisições atingido. Aguarde alguns minutos.',
  [ERROR_CODES.API_ERROR]: 'Erro no serviço de IA. Tente novamente.',
}

export function handleApiError(error: unknown): string {
  if (error instanceof TranscriptionError) {
    return error.message
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('rate limit') || message.includes('429')) {
      return ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT]
    }

    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR]
    }

    if (message.includes('insufficient_quota') || message.includes('quota')) {
      return 'Créditos insuficientes na API OpenAI.'
    }

    return error.message
  }

  return 'Erro inesperado. Tente novamente.'
}
