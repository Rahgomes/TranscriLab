import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { ACCEPTED_AUDIO_FORMATS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/features/transcription'
import { ERROR_CODES, ERROR_MESSAGES, handleApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('audio') as File | null

    if (!file) {
      return NextResponse.json(
        { error: ERROR_MESSAGES[ERROR_CODES.NO_FILE] },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE_MB}MB` },
        { status: 400 }
      )
    }

    const isValidFormat = ACCEPTED_AUDIO_FORMATS.some(
      (format) => file.type === format || file.type.startsWith(format.split('/')[0])
    )

    if (!isValidFormat && file.type !== '') {
      return NextResponse.json(
        { error: ERROR_MESSAGES[ERROR_CODES.INVALID_FORMAT] },
        { status: 400 }
      )
    }

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'gpt-4o-transcribe-diarize',
      language: 'pt',
      response_format: 'diarized_json' as unknown as 'json',
      chunking_strategy: 'auto',
    } as Parameters<typeof openai.audio.transcriptions.create>[0])

    // Extrair segmentos da resposta diarizada
    const rawSegments = (transcription as unknown as { segments?: Array<{ speaker: string; text: string; start: number; end: number }> }).segments ?? []

    const segments = rawSegments.map((s, i) => ({
      index: i,
      speaker: s.speaker,
      text: s.text,
      startTime: s.start,
      endTime: s.end,
    }))

    const fullText = rawSegments.map((s) => s.text).join(' ')
    const speakers = new Set(rawSegments.map((s) => s.speaker))

    return NextResponse.json({
      text: fullText,
      segments,
      speakerCount: speakers.size,
      hasDiarization: segments.length > 0,
    })
  } catch (error) {
    console.error('Erro na transcrição:', error)

    const message = handleApiError(error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
