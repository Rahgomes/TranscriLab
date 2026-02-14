import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFoundResponse, dbUnavailableResponse } from '@/lib/api'
import { mapTranscriptionToHistoryItem, mapSegments, mapEvents } from '@/lib/mappers'

type RouteParams = { params: Promise<{ id: string }> }

interface SegmentInput {
  id?: string
  index: number
  speaker: string
  speakerLabel?: string | null
  text: string
  startTime: number
  endTime: number
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const { id } = await params
    const body = await request.json()
    const { transcriptionText, segments } = body as {
      transcriptionText?: string
      segments?: SegmentInput[]
    }

    // Buscar transcricao com relacoes
    const transcription = await prisma.transcription.findUnique({
      where: { id },
      include: {
        category: true,
        summary: true,
        segments: { orderBy: { index: 'asc' } },
        events: { orderBy: { startTime: 'asc' } },
      },
    })

    if (!transcription) {
      return notFoundResponse('Transcricao')
    }

    // Validar que ha algo para editar
    if (!transcriptionText && (!segments || segments.length === 0)) {
      return errorResponse('Nenhuma alteracao fornecida')
    }

    // Calcular resumo das mudancas
    const changes: string[] = []

    if (segments && segments.length > 0) {
      let editedSegments = 0
      let renamedSpeakers = 0

      for (const seg of segments) {
        const original = transcription.segments.find((s) => s.index === seg.index)
        if (original) {
          if (original.text !== seg.text) editedSegments++
          if ((original.speakerLabel ?? null) !== (seg.speakerLabel ?? null)) renamedSpeakers++
        }
      }

      if (editedSegments > 0) {
        changes.push(`${editedSegments} segmento${editedSegments > 1 ? 's' : ''} editado${editedSegments > 1 ? 's' : ''}`)
      }
      if (renamedSpeakers > 0) {
        changes.push(`${renamedSpeakers} falante${renamedSpeakers > 1 ? 's' : ''} renomeado${renamedSpeakers > 1 ? 's' : ''}`)
      }
    }

    if (transcriptionText && transcriptionText !== transcription.transcription) {
      changes.push('Texto da transcricao editado')
    }

    if (changes.length === 0) {
      return errorResponse('Nenhuma alteracao detectada')
    }

    const changesSummary = changes.join(', ')
    const newVersionNumber = transcription.currentVersion + 1

    // Snapshot do estado atual (pre-edicao)
    const snapshot = {
      transcriptionText: transcription.transcription,
      segments: transcription.segments.map((s) => ({
        index: s.index,
        speaker: s.speaker,
        speakerLabel: s.speakerLabel,
        text: s.text,
        originalText: s.originalText,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      events: transcription.events.map((e) => ({
        type: e.type,
        startTime: e.startTime,
        endTime: e.endTime,
        confidence: e.confidence,
        description: e.description,
        source: e.source,
      })),
    }

    // Executar tudo em transacao
    const result = await prisma.$transaction(async (tx) => {
      // Criar versao com snapshot
      await tx.transcriptionVersion.create({
        data: {
          transcriptionId: id,
          versionNumber: newVersionNumber,
          changesSummary,
          snapshot,
        },
      })

      // Atualizar segmentos se fornecidos
      if (segments && segments.length > 0) {
        // Deletar segmentos existentes e recriar
        await tx.transcriptionSegment.deleteMany({
          where: { transcriptionId: id },
        })

        await tx.transcriptionSegment.createMany({
          data: segments.map((s) => ({
            transcriptionId: id,
            index: s.index,
            speaker: s.speaker,
            speakerLabel: s.speakerLabel ?? null,
            text: s.text,
            // Preservar originalText dos segmentos originais, ou usar o texto atual como original se nao existir
            originalText: transcription.segments.find((orig) => orig.index === s.index)?.originalText ?? s.text,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        })
      }

      // Determinar texto corrido atualizado
      const updatedText = transcriptionText
        ?? (segments
          ? segments.map((s) => s.text).join('\n\n')
          : transcription.transcription)

      // Atualizar transcricao principal
      const updated = await tx.transcription.update({
        where: { id },
        data: {
          transcription: updatedText,
          currentVersion: newVersionNumber,
        },
        include: {
          category: true,
          summary: true,
          segments: { orderBy: { index: 'asc' } },
          events: { orderBy: { startTime: 'asc' } },
        },
      })

      return updated
    })

    const item = mapTranscriptionToHistoryItem(result)
    const mappedSegments = result.segments ? mapSegments(result.segments) : []
    const mappedEvents = result.events ? mapEvents(result.events) : []

    return jsonResponse({
      ...item,
      segments: mappedSegments,
      events: mappedEvents,
      versionCreated: newVersionNumber,
    })
  } catch (error) {
    console.error('Erro ao salvar edicoes:', error)
    return errorResponse('Erro interno ao salvar edicoes', 500)
  }
}
