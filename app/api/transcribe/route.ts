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
      model: 'gpt-4o-transcribe',
      language: 'pt',
      response_format: 'json',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    console.error('Erro na transcrição:', error)

    const message = handleApiError(error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
