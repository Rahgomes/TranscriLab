import { NextRequest } from 'next/server'
import { toFile } from 'groq-sdk'
import { groq } from '@/lib/groq'
import { jsonResponse, errorResponse } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile || audioFile.size === 0) {
      return errorResponse('Arquivo de audio ausente ou vazio')
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const transcription = await groq.audio.transcriptions.create({
      model: 'whisper-large-v3-turbo',
      file: await toFile(buffer, 'chunk.webm'),
      // Removed 'language' parameter to allow multi-language detection
      // Whisper will auto-detect the language of each segment
      response_format: 'verbose_json',
      temperature: 0,
      prompt:
        'Transcreva o áudio fielmente, mantendo termos em qualquer idioma exatamente como falados (português, inglês, espanhol, etc). Use pontuação adequada.',
    })

    return jsonResponse({
      text: transcription.text?.trim() || '',
    })
  } catch (error) {
    console.error('Groq transcription error:', error)

    // Return empty text for audio-related errors (silence, too short, etc.)
    // to avoid disrupting the recording flow
    const message = error instanceof Error ? error.message : ''
    if (
      message.includes('audio') ||
      message.includes('too short') ||
      message.includes('no speech')
    ) {
      return jsonResponse({ text: '' })
    }

    return errorResponse('Erro ao transcrever chunk de audio', 500)
  }
}
