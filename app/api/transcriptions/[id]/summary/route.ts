import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openai } from '@/lib/openai'
import { jsonResponse, errorResponse, notFoundResponse } from '@/lib/api'
import { mapSummaryToSummaryData } from '@/lib/mappers'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Buscar transcricao
    const transcription = await prisma.transcription.findUnique({
      where: { id },
      select: { id: true, transcription: true },
    })

    if (!transcription) {
      return notFoundResponse('Transcricao')
    }

    if (transcription.transcription.length < 50) {
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
          content: transcription.transcription,
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

    // Upsert do summary
    const summary = await prisma.summary.upsert({
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

    return jsonResponse(mapSummaryToSummaryData(summary))
  } catch (error) {
    console.error('Erro ao gerar resumo:', error)

    if (error instanceof SyntaxError) {
      return errorResponse('Erro ao processar resposta da IA', 500)
    }

    return errorResponse('Erro ao gerar resumo. Tente novamente.', 500)
  }
}
