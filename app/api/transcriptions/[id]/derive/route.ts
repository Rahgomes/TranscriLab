import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openai } from '@/lib/openai'
import { jsonResponse, errorResponse, notFoundResponse, dbUnavailableResponse } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { trackLLMUsage } from '@/features/dashboard/lib/trackUsage'
import type { DerivedContentType } from '@prisma/client'

type RouteParams = { params: Promise<{ id: string }> }

const PROMPTS: Record<string, string> = {
  MEETING_MINUTES: 'Crie uma ata de reunião formal e organizada.',
  TASK_LIST: 'Extraia todas as tarefas e ações mencionadas em formato de checklist.',
  CLIENT_EMAIL: 'Redija um email profissional para cliente resumindo os pontos principais.',
  WHATSAPP_MESSAGE: 'Crie uma mensagem curta e informal para WhatsApp.',
  LINKEDIN_POST: 'Crie um post engajante para LinkedIn.',
  VIDEO_SCRIPT: 'Crie um roteiro de vídeo com introdução, desenvolvimento e conclusão.',
  FAQ: 'Extraia perguntas frequentes e suas respostas.',
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const { id } = await params
    const body = await request.json()
    const { type } = body as { type: DerivedContentType }

    if (!type || !PROMPTS[type]) {
      return errorResponse('Tipo de conteúdo inválido')
    }

    const transcription = await prisma.transcription.findFirst({
      where: { id, userId: session.userId },
    })
    if (!transcription) {
      return notFoundResponse('Transcricao')
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PROMPTS[type] },
        { role: 'user', content: transcription.transcription },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    })

    const content = completion.choices[0]?.message?.content || ''
    const tokensUsed = completion.usage?.total_tokens || 0
    const inputTokens = completion.usage?.prompt_tokens || 0
    const outputTokens = completion.usage?.completion_tokens || 0

    // Registrar uso da API
    await trackLLMUsage(
      session.userId,
      'OPENAI',
      'DERIVED_CONTENT',
      'gpt-4o-mini',
      inputTokens,
      outputTokens,
      { transcriptionId: id, contentType: type }
    )

    const derived = await prisma.derivedContent.create({
      data: {
        transcriptionId: id,
        type,
        title: `${type} - ${new Date().toLocaleDateString('pt-BR')}`,
        content,
        tokensUsed,
        modelUsed: 'gpt-4o-mini',
      },
    })

    return jsonResponse(derived, 201)
  } catch (error) {
    console.error('Erro ao derivar conteúdo:', error)
    return errorResponse('Erro ao gerar conteúdo', 500)
  }
}
