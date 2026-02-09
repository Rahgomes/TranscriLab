import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Texto não fornecido' },
        { status: 400 }
      )
    }

    if (text.length < 50) {
      return NextResponse.json(
        { error: 'Texto muito curto para gerar resumo' },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especializado em análise de textos transcritos.
Analise o texto fornecido e retorne um JSON com:
1. "summary": Um resumo conciso em 2-3 frases
2. "insights": Array com 3-5 pontos-chave ou insights importantes

Responda APENAS com JSON válido, sem markdown ou formatação adicional.`,
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
      return NextResponse.json(
        { error: 'Erro ao gerar resumo' },
        { status: 500 }
      )
    }

    const result = JSON.parse(content)

    return NextResponse.json({
      summary: result.summary || '',
      insights: result.insights || [],
      tokensUsed: completion.usage?.total_tokens || 0,
    })
  } catch (error) {
    console.error('Erro no resumo:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Erro ao processar resposta da IA' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao gerar resumo. Tente novamente.' },
      { status: 500 }
    )
  }
}
