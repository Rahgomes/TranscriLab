import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFoundResponse, dbUnavailableResponse } from '@/lib/api'
// mappers not needed here since we inline the mapping for select'd fields

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const cursor = searchParams.get('cursor') || undefined

    // Verificar se a transcricao existe
    const transcription = await prisma.transcription.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!transcription) {
      return notFoundResponse('Transcricao')
    }

    const total = await prisma.transcriptionVersion.count({
      where: { transcriptionId: id },
    })

    const versions = await prisma.transcriptionVersion.findMany({
      where: { transcriptionId: id },
      orderBy: { versionNumber: 'desc' },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      // Selecionar apenas metadados, sem snapshot (performance)
      select: {
        id: true,
        versionNumber: true,
        editedAt: true,
        changesSummary: true,
        editorId: true,
      },
    })

    const hasMore = versions.length > limit
    const nextCursor = hasMore ? versions[limit - 1].id : null
    const results = hasMore ? versions.slice(0, -1) : versions

    return jsonResponse({
      versions: results.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        editedAt: v.editedAt.toISOString(),
        changesSummary: v.changesSummary,
        editorId: v.editorId ?? undefined,
      })),
      nextCursor,
      total,
    })
  } catch (error) {
    console.error('Erro ao listar versoes:', error)
    return errorResponse('Erro interno ao listar versoes', 500)
  }
}
