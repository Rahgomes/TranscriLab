import { prisma } from '@/lib/prisma'
import { calculateCost } from './pricing'
import type { ApiProvider, ApiOperation } from '../types'

interface TrackUsageParams {
  userId: string
  provider: ApiProvider
  operation: ApiOperation
  model: string
  inputTokens?: number
  outputTokens?: number
  audioDurationSeconds?: number
  metadata?: Record<string, unknown>
}

/**
 * Registra o uso de uma API no banco de dados
 */
export async function trackApiUsage({
  userId,
  provider,
  operation,
  model,
  inputTokens = 0,
  outputTokens = 0,
  audioDurationSeconds,
  metadata,
}: TrackUsageParams): Promise<void> {
  if (!prisma) {
    console.warn('Prisma não disponível, pulando tracking de uso')
    return
  }

  try {
    const totalTokens = inputTokens + outputTokens
    const estimatedCost = calculateCost(
      provider,
      model,
      inputTokens,
      outputTokens,
      audioDurationSeconds
    )

    await prisma.apiUsage.create({
      data: {
        userId,
        provider,
        operation,
        model,
        inputTokens,
        outputTokens,
        totalTokens,
        audioDuration: audioDurationSeconds || null,
        estimatedCost,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    })
  } catch (error) {
    // Log mas não falha a operação principal
    console.error('Erro ao registrar uso de API:', error)
  }
}

/**
 * Helper para tracking de transcrição
 */
export async function trackTranscription(
  userId: string,
  provider: ApiProvider,
  model: string,
  audioDurationSeconds: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  return trackApiUsage({
    userId,
    provider,
    operation: 'TRANSCRIPTION',
    model,
    audioDurationSeconds,
    metadata,
  })
}

/**
 * Helper para tracking de resumo/chat
 */
export async function trackLLMUsage(
  userId: string,
  provider: ApiProvider,
  operation: ApiOperation,
  model: string,
  inputTokens: number,
  outputTokens: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  return trackApiUsage({
    userId,
    provider,
    operation,
    model,
    inputTokens,
    outputTokens,
    metadata,
  })
}
