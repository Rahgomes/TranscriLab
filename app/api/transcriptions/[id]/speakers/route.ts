import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFoundResponse, dbUnavailableResponse } from '@/lib/api'
import { getSession } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const { id } = await params
    const body = await request.json()
    const { action, speakerId, speakerIds, newName } = body

    // Verificar ownership
    const transcription = await prisma.transcription.findFirst({
      where: { id, userId: session.userId },
    })
    if (!transcription) {
      return notFoundResponse('Transcrição')
    }

    if (action === 'rename') {
      // Renomear um speaker específico
      if (!speakerId || !newName) {
        return errorResponse('speakerId e newName são obrigatórios')
      }

      // Atualizar speakerLabel em todos os segmentos desse speaker
      await prisma.transcriptionSegment.updateMany({
        where: {
          transcriptionId: id,
          speaker: speakerId,
        },
        data: {
          speakerLabel: newName,
        },
      })

      return jsonResponse({ success: true, action: 'rename', speakerId, newName })
    }

    if (action === 'merge') {
      // Mesclar múltiplos speakers em um
      if (!speakerIds || !Array.isArray(speakerIds) || speakerIds.length < 2 || !newName) {
        return errorResponse('speakerIds (array com 2+) e newName são obrigatórios')
      }

      // Pegar o primeiro speakerId como o "principal"
      const primarySpeakerId = speakerIds[0]

      // Atualizar todos os segmentos dos speakers selecionados
      await prisma.transcriptionSegment.updateMany({
        where: {
          transcriptionId: id,
          speaker: { in: speakerIds },
        },
        data: {
          speaker: primarySpeakerId,
          speakerLabel: newName,
        },
      })

      return jsonResponse({
        success: true,
        action: 'merge',
        mergedSpeakers: speakerIds,
        newSpeakerId: primarySpeakerId,
        newName,
      })
    }

    return errorResponse('Ação inválida. Use "rename" ou "merge"')
  } catch (error) {
    console.error('Erro ao gerenciar speakers:', error)
    return errorResponse('Erro interno', 500)
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const { id } = await params

    // Verificar ownership
    const transcription = await prisma.transcription.findFirst({
      where: { id, userId: session.userId },
    })
    if (!transcription) {
      return notFoundResponse('Transcrição')
    }

    // Buscar todos os speakers únicos e suas estatísticas
    const segments = await prisma.transcriptionSegment.findMany({
      where: { transcriptionId: id },
      select: {
        speaker: true,
        speakerLabel: true,
        startTime: true,
        endTime: true,
      },
    })

    // Agrupar por speaker
    const speakerMap = new Map<string, {
      id: string
      displayName: string
      totalDuration: number
      segmentCount: number
    }>()

    for (const seg of segments) {
      const existing = speakerMap.get(seg.speaker)
      const duration = seg.endTime - seg.startTime

      if (existing) {
        existing.totalDuration += duration
        existing.segmentCount += 1
        // Usar speakerLabel se disponível
        if (seg.speakerLabel && !existing.displayName.includes(seg.speakerLabel)) {
          existing.displayName = seg.speakerLabel
        }
      } else {
        speakerMap.set(seg.speaker, {
          id: seg.speaker,
          displayName: seg.speakerLabel || seg.speaker,
          totalDuration: duration,
          segmentCount: 1,
        })
      }
    }

    const speakers = Array.from(speakerMap.values())

    return jsonResponse({ speakers })
  } catch (error) {
    console.error('Erro ao buscar speakers:', error)
    return errorResponse('Erro interno', 500)
  }
}
