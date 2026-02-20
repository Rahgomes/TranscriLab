import { NextRequest } from 'next/server'
import { openai } from '@/lib/openai'
import { jsonResponse, errorResponse } from '@/lib/api'

const SYSTEM_PROMPT = `Você é um especialista em revisão de transcrições de áudio.

TAREFA: Corrigir APENAS erros de transcrição automática.

O QUE CORRIGIR:
- Palavras mal interpretadas pelo sistema de transcrição
- Pontuação ausente ou incorreta
- Capitalização (início de frases, nomes próprios)
- Acentuação em português

O QUE MANTER EXATAMENTE COMO ESTÁ:
- O significado e a essência do que foi dito
- Termos técnicos (mesmo que pareçam "errados")
- Palavras em outros idiomas (inglês, espanhol, etc.) - são intencionais
- Gírias e expressões coloquiais
- O estilo e tom do falante
- Repetições ou hesitações naturais da fala

EXEMPLOS:
- "o rabote" → "o Rah" (nome próprio mal transcrito)
- "cloud computing" → manter em inglês
- "isso é muito legal, sabe?" → manter a expressão coloquial

Retorne APENAS o texto corrigido, sem explicações ou comentários.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return errorResponse('Texto ausente ou inválido')
    }

    // Skip very short texts (less than 10 chars)
    if (text.trim().length < 10) {
      return jsonResponse({ text: text.trim(), tokensUsed: 0 })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0, // Deterministic output
      max_tokens: Math.ceil(text.length * 1.5) + 100,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
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
      originalLength: text.length,
      correctedLength: correctedText.length,
    })
  } catch (error) {
    console.error('Postprocess error:', error)
    
    // If GPT fails, return original text (don't break the flow)
    const body = await request.clone().json().catch(() => ({ text: '' }))
    return jsonResponse({
      text: body.text || '',
      tokensUsed: 0,
      error: 'Fallback to original text',
    })
  }
}
