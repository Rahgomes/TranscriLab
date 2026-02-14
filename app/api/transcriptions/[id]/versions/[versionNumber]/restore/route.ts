import { NextRequest } from 'next/server'
import type { AudioEventType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFoundResponse, dbUnavailableResponse } from '@/lib/api'
import { mapTranscriptionToHistoryItem, mapSegments, mapEvents } from '@/lib/mappers'

type RouteParams = { params: Promise<{ id: string; versionNumber: string }> }

interface SnapshotSegment {
  index: number
  speaker: string
  speakerLabel: string | null
  text: string
  originalText: string | null
  startTime: number
  endTime: number
}

interface SnapshotEvent {
  type: string
  startTime: number
  endTime: number
  confidence: number
  description: string | null
  source: string
}

interface VersionSnapshot {
  transcriptionText: string
  segments: SnapshotSegment[]
  events: SnapshotEvent[]
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const { id, versionNumber: versionStr } = await params
    const versionNumber = parseInt(versionStr, 10)

    if (isNaN(versionNumber) || versionNumber < 1) {
      return errorResponse('Numero de versao invalido')
    }

    // Buscar a versao a restaurar
    const versionToRestore = await prisma.transcriptionVersion.findUnique({
      where: {
        transcriptionId_versionNumber: {
          transcriptionId: id,
          versionNumber,
        },
      },
    })

    if (!versionToRestore) {
      return notFoundResponse('Versao')
    }

    // Buscar estado atual da transcricao
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

    const snapshot = versionToRestore.snapshot as unknown as VersionSnapshot
    const newVersionNumber = transcription.currentVersion + 1

    // Snapshot do estado atual antes da restauracao
    const currentSnapshot = {
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

    // Executar restauracao em transacao
    const result = await prisma.$transaction(async (tx) => {
      // Criar nova versao com snapshot do estado atual
      await tx.transcriptionVersion.create({
        data: {
          transcriptionId: id,
          versionNumber: newVersionNumber,
          changesSummary: `Restaurado para versao #${versionNumber}`,
          snapshot: currentSnapshot,
        },
      })

      // Restaurar segmentos do snapshot
      await tx.transcriptionSegment.deleteMany({
        where: { transcriptionId: id },
      })

      if (snapshot.segments && snapshot.segments.length > 0) {
        await tx.transcriptionSegment.createMany({
          data: snapshot.segments.map((s) => ({
            transcriptionId: id,
            index: s.index,
            speaker: s.speaker,
            speakerLabel: s.speakerLabel ?? null,
            text: s.text,
            originalText: s.originalText ?? s.text,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        })
      }

      // Restaurar eventos do snapshot
      await tx.audioEvent.deleteMany({
        where: { transcriptionId: id },
      })

      if (snapshot.events && snapshot.events.length > 0) {
        await tx.audioEvent.createMany({
          data: snapshot.events.map((e) => ({
            transcriptionId: id,
            type: e.type as AudioEventType,
            startTime: e.startTime,
            endTime: e.endTime,
            confidence: e.confidence,
            description: e.description ?? null,
            source: e.source,
          })),
        })
      }

      // Atualizar transcricao principal
      const updated = await tx.transcription.update({
        where: { id },
        data: {
          transcription: snapshot.transcriptionText,
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
      restoredFromVersion: versionNumber,
      versionCreated: newVersionNumber,
    })
  } catch (error) {
    console.error('Erro ao restaurar versao:', error)
    return errorResponse('Erro interno ao restaurar versao', 500)
  }
}
