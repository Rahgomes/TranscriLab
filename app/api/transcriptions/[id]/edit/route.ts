import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFoundResponse, dbUnavailableResponse } from '@/lib/api'
import { getSession } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const { id } = await params
    const body = await request.json()
    const { segments, transcription: newText, changesSummary } = body

    const existing = await prisma.transcription.findFirst({
      where: { id, userId: session.userId },
      include: { segments: true },
    })
    if (!existing) {
      return notFoundResponse('Transcricao')
    }

    const nextVersion = existing.currentVersion + 1

    await prisma.$transaction(async (tx) => {
      // Criar versão de backup
      await tx.transcriptionVersion.create({
        data: {
          transcriptionId: id,
          versionNumber: nextVersion,
          editorId: session.userId,
          changesSummary: changesSummary || 'Edição de segmentos',
          snapshot: {
            transcription: existing.transcription,
            segments: existing.segments,
          },
        },
      })

      // Atualizar transcrição
      if (newText) {
        await tx.transcription.update({
          where: { id },
          data: {
            transcription: newText,
            currentVersion: nextVersion,
          },
        })
      }

      // Atualizar segmentos
      if (Array.isArray(segments)) {
        for (const seg of segments) {
          await tx.transcriptionSegment.update({
            where: { id: seg.id },
            data: {
              text: seg.text,
              speakerLabel: seg.speakerLabel,
            },
          })
        }
      }
    })

    return jsonResponse({ success: true, version: nextVersion })
  } catch (error) {
    console.error('Erro ao editar:', error)
    return errorResponse('Erro ao salvar edições', 500)
  }
}
