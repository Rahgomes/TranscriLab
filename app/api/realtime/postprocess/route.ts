import { NextRequest } from 'next/server'
import { openai } from '@/lib/openai'
import { jsonResponse, errorResponse } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return errorResponse('Texto muito curto para processamento (minimo 10 caracteres)')
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: Math.ceil(text.length * 1.5),
      messages: [
        {
          role: 'system',
          content:
            'Voce e um especialista em revisao de texto transcrito de audio em portugues brasileiro. ' +
            'Corrija a pontuacao, capitalizacao e acentuacao do texto fornecido. ' +
            'Mantenha o conteudo identico — nao adicione, remova ou altere palavras. ' +
            'Retorne apenas o texto corrigido, sem explicacoes.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
    })

    const correctedText = response.choices[0]?.message?.content?.trim() || text
    const tokensUsed = response.usage?.total_tokens ?? 0

    return jsonResponse({
      text: correctedText,
      tokensUsed,
    })
  } catch (error) {
    console.error('Postprocess error:', error)
    return errorResponse('Erro ao processar texto', 500)
  }
}
