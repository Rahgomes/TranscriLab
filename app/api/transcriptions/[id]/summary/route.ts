import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openai } from '@/lib/openai'
import { jsonResponse, errorResponse } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { trackLLMUsage } from '@/features/dashboard/lib/trackUsage'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { transcriptionText } = body as { transcriptionText?: string }

    let text: string

    if (transcriptionText) {
      // Client sent transcription data directly (localStorage-first mode)
      text = transcriptionText
    } else if (prisma) {
      // Fetch from DB - verificar ownership
      const transcription = await prisma.transcription.findFirst({
        where: { id, userId: session.userId },
        select: { transcription: true },
      })

      if (!transcription) {
        return errorResponse('Transcrição não encontrada', 404)
      }

      text = transcription.transcription
    } else {
      return errorResponse('Dados da transcrição não fornecidos e banco de dados indisponível', 400)
    }

    if (text.length < 50) {
      return errorResponse('Texto muito curto para gerar resumo')
    }

    // Chamar OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Voce e um assistente especializado em analise de textos transcritos.
Analise o texto fornecido e retorne um JSON com:
1. "summary": Um resumo conciso em 2-3 frases
2. "insights": Array com 3-5 pontos-chave ou insights importantes

Responda APENAS com JSON valido, sem markdown ou formatacao adicional.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return errorResponse('Erro ao gerar resumo', 500)
    }

    const result = JSON.parse(content)
    const tokensUsed = completion.usage?.total_tokens || 0
    const inputTokens = completion.usage?.prompt_tokens || 0
    const outputTokens = completion.usage?.completion_tokens || 0
    const generatedAt = new Date().toISOString()

    // Registrar uso da API
    await trackLLMUsage(
      session.userId,
      'OPENAI',
      'SUMMARY',
      'gpt-4o-mini',
      inputTokens,
      outputTokens,
      { transcriptionId: id }
    )

    // Try to save to DB (optional — if it fails, still return the content)
    if (prisma) {
      try {
        await prisma.summary.upsert({
          where: { transcriptionId: id },
          update: {
            summary: result.summary || '',
            insights: result.insights || [],
            tokensUsed,
            generatedAt: new Date(),
          },
          create: {
            transcriptionId: id,
            summary: result.summary || '',
            insights: result.insights || [],
            tokensUsed,
            generatedAt: new Date(),
          },
        })
      } catch (dbError) {
        console.warn('[TranscriLab] Falha ao salvar resumo no banco:', dbError)
      }
    }

    return jsonResponse({
      summary: result.summary || '',
      insights: result.insights || [],
      tokensUsed,
      generatedAt,
    })
  } catch (error) {
    console.error('Erro ao gerar resumo:', error)

    if (error instanceof SyntaxError) {
      return errorResponse('Erro ao processar resposta da IA', 500)
    }

    return errorResponse('Erro ao gerar resumo. Tente novamente.', 500)
  }
}
