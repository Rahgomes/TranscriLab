import type { ApiProvider } from '../types'

// Preços em USD por unidade
// Atualizado em: Fevereiro 2026

export interface ModelPricing {
  inputPer1kTokens?: number
  outputPer1kTokens?: number
  perMinuteAudio?: number
}

export const PRICING: Record<ApiProvider, Record<string, ModelPricing>> = {
  OPENAI: {
    // Whisper
    'whisper-1': {
      perMinuteAudio: 0.006,
    },
    // GPT-4o
    'gpt-4o': {
      inputPer1kTokens: 0.005,
      outputPer1kTokens: 0.015,
    },
    'gpt-4o-mini': {
      inputPer1kTokens: 0.00015,
      outputPer1kTokens: 0.0006,
    },
    // GPT-4
    'gpt-4-turbo': {
      inputPer1kTokens: 0.01,
      outputPer1kTokens: 0.03,
    },
    // GPT-3.5
    'gpt-3.5-turbo': {
      inputPer1kTokens: 0.0005,
      outputPer1kTokens: 0.0015,
    },
  },
  GROQ: {
    // Whisper (gratuito no free tier)
    'whisper-large-v3': {
      perMinuteAudio: 0.0001, // Praticamente grátis
    },
    'whisper-large-v3-turbo': {
      perMinuteAudio: 0.0001,
    },
    // LLaMA
    'llama-3.3-70b-versatile': {
      inputPer1kTokens: 0.00059,
      outputPer1kTokens: 0.00079,
    },
    'llama-3.1-8b-instant': {
      inputPer1kTokens: 0.00005,
      outputPer1kTokens: 0.00008,
    },
    // Mixtral
    'mixtral-8x7b-32768': {
      inputPer1kTokens: 0.00024,
      outputPer1kTokens: 0.00024,
    },
  },
}

/**
 * Calcula o custo estimado de uma operação
 */
export function calculateCost(
  provider: ApiProvider,
  model: string,
  inputTokens: number,
  outputTokens: number,
  audioDurationSeconds?: number
): number {
  const modelPricing = PRICING[provider]?.[model]
  
  if (!modelPricing) {
    // Modelo desconhecido, usar estimativa conservadora
    return 0
  }

  let cost = 0

  // Custo de tokens
  if (modelPricing.inputPer1kTokens) {
    cost += (inputTokens / 1000) * modelPricing.inputPer1kTokens
  }
  if (modelPricing.outputPer1kTokens) {
    cost += (outputTokens / 1000) * modelPricing.outputPer1kTokens
  }

  // Custo de áudio
  if (modelPricing.perMinuteAudio && audioDurationSeconds) {
    const minutes = audioDurationSeconds / 60
    cost += minutes * modelPricing.perMinuteAudio
  }

  return cost
}

/**
 * Formata valor em USD para exibição
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`
  }
  return `$${cost.toFixed(2)}`
}

/**
 * Formata valor em BRL (estimativa)
 */
export function formatCostBRL(cost: number, exchangeRate = 5.0): string {
  const brl = cost * exchangeRate
  return `R$ ${brl.toFixed(2)}`
}
