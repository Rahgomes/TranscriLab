import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors
let openaiInstance: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined in environment variables')
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

// For backward compatibility
export const openai = {
  get chat() {
    return getOpenAI().chat
  },
  get audio() {
    return getOpenAI().audio
  }
}
