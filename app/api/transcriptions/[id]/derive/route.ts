import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openai } from '@/lib/openai'
import { jsonResponse, errorResponse } from '@/lib/api'
import { PROMPT_CONFIGS, getInput, getTitle } from '@/lib/derivedContentPrompts'
import type { DerivedContentType } from '@prisma/client'

type RouteParams = { params: Promise<{ id: string }> }

const VALID_TYPES: DerivedContentType[] = [
  'MEETING_MINUTES',
  'TASK_LIST',
  'CLIENT_EMAIL',
  'WHATSAPP_MESSAGE',
  'LINKEDIN_POST',
  'VIDEO_SCRIPT',
  'FAQ',
]

const MODEL = 'gpt-4o-mini'

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      type,
      transcriptionText,
      summary,
      insights,
      segments,
      fileName,
    } = body as {
      type: DerivedContentType
      transcriptionText?: string
      summary?: string
      insights?: string[]
      segments?: Array<{ speaker: string; text: string; speakerLabel?: string }>
      fileName?: string
    }

    // Validar tipo
    if (!type || !VALID_TYPES.includes(type)) {
      return errorResponse(
        `Tipo inválido. Tipos aceitos: ${VALID_TYPES.join(', ')}`,
        400
      )
    }

    const config = PROMPT_CONFIGS[type]
    let inputData: {
      transcription: string
      summary?: string
      insights?: string[]
      segments?: Array<{ speaker: string; text: string; speakerLabel?: string }>
      fileName: string
    }

    if (transcriptionText) {
      // Client sent transcription data directly (localStorage-first mode)
      inputData = {
        transcription: transcriptionText,
        summary,
        insights,
        segments,
        fileName: fileName || 'Transcricao',
      }
    } else if (prisma) {
      // Fetch from DB (original behavior)
      const transcription = await prisma.transcription.findUnique({
        where: { id },
        include: {
          summary: true,
          segments: config.needsSegments
            ? { orderBy: { index: 'asc' } }
            : false,
        },
      })

      if (!transcription) {
        return errorResponse('Transcrição não encontrada', 404)
      }

      if (transcription.transcription.length < 50) {
        return errorResponse('Texto muito curto para gerar conteúdo derivado')
      }

      inputData = {
        transcription: transcription.transcription,
        summary: transcription.summary?.summary,
        insights: transcription.summary?.insights,
        segments: transcription.segments?.map((s) => ({
          speaker: s.speaker,
          text: s.text,
          speakerLabel: s.speakerLabel ?? undefined,
        })),
        fileName: transcription.fileName,
      }
    } else {
      return errorResponse('Dados da transcrição não fornecidos e banco de dados indisponível', 400)
    }

    if (inputData.transcription.length < 50) {
      return errorResponse('Texto muito curto para gerar conteúdo derivado')
    }

    const userInput = getInput(type, inputData)

    // Chamar OpenAI
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: userInput },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      response_format: { type: 'json_object' },
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      return errorResponse('Erro ao gerar conteúdo. Tente novamente.', 500)
    }

    const result = JSON.parse(responseContent)
    const tokensUsed = completion.usage?.total_tokens || 0
    const title = getTitle(type, inputData.fileName)

    // Generate a fallback ID
    let derivedId = crypto.randomUUID()

    // Try to save to DB (optional — if it fails, still return the content)
    if (prisma) {
      try {
        const derived = await prisma.derivedContent.create({
          data: {
            transcriptionId: id,
            type,
            title,
            content: result.content || '',
            tokensUsed,
            modelUsed: MODEL,
            metadata: result.metadata || null,
          },
        })
        derivedId = derived.id
      } catch (dbError) {
        console.warn('[TranscriLab] Falha ao salvar conteúdo derivado no banco:', dbError)
      }
    }

    return jsonResponse(
      {
        id: derivedId,
        transcriptionId: id,
        type,
        title,
        content: result.content || '',
        tokensUsed,
        modelUsed: MODEL,
        metadata: result.metadata || null,
        createdAt: new Date().toISOString(),
      },
      201
    )
  } catch (error) {
    console.error('Erro ao gerar conteúdo derivado:', error)

    if (error instanceof SyntaxError) {
      return errorResponse('Erro ao processar resposta da IA', 500)
    }

    return errorResponse('Erro ao gerar conteúdo. Tente novamente.', 500)
  }
}
