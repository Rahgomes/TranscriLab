import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, notFoundResponse, dbUnavailableResponse } from '@/lib/api'
import { mapDerivedContent } from '@/lib/mappers'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    if (!prisma) return dbUnavailableResponse()

    const { id } = await params

    // Verificar se a transcrição existe
    const transcription = await prisma.transcription.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!transcription) {
      return notFoundResponse('Transcrição')
    }

    const derivedContents = await prisma.derivedContent.findMany({
      where: { transcriptionId: id },
      orderBy: { createdAt: 'desc' },
    })

    return jsonResponse(derivedContents.map(mapDerivedContent))
  } catch (error) {
    console.error('Erro ao listar conteúdos derivados:', error)
    return jsonResponse({ error: 'Erro ao listar conteúdos derivados' }, 500)
  }
}
