import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFoundResponse, dbUnavailableResponse } from '@/lib/api'
import { getSession } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const { id } = await params

    const transcription = await prisma.transcription.findFirst({
      where: { id, userId: session.userId },
    })
    if (!transcription) {
      return notFoundResponse('Transcricao')
    }

    const versions = await prisma.transcriptionVersion.findMany({
      where: { transcriptionId: id },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        versionNumber: true,
        editedAt: true,
        editorId: true,
        changesSummary: true,
      },
    })

    return jsonResponse({
      currentVersion: transcription.currentVersion,
      versions,
    })
  } catch (error) {
    console.error('Erro ao listar versões:', error)
    return errorResponse('Erro interno', 500)
  }
}
