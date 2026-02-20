import Groq from 'groq-sdk'

// Lazy initialization to avoid build-time errors
let groqInstance: Groq | null = null

export function getGroq(): Groq {
  if (!groqInstance) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not defined in environment variables')
    }
    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
  }
  return groqInstance
}

// For backward compatibility, export a getter
export const groq = {
  get audio() {
    return getGroq().audio
  }
}
