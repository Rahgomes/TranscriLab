import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFoundResponse, dbUnavailableResponse } from '@/lib/api'
import { mapTranscriptionToHistoryItem, mapSegments, mapEvents } from '@/lib/mappers'
import { getSession } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!prisma) return dbUnavailableResponse()

  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const { id } = await params

    const transcription = await prisma.transcription.findFirst({
      where: {
        id,
        userId: session.userId,
      },
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

    const item = mapTranscriptionToHistoryItem(transcription)
    const segments = transcription.segments
      ? mapSegments(transcription.segments)
      : []
    const events = transcription.events
      ? mapEvents(transcription.events)
      : []

    return jsonResponse({ ...item, segments, events })
  } catch (error) {
    console.error('Erro ao buscar transcricao:', error)
    return errorResponse('Erro interno ao buscar transcricao', 500)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!prisma) return dbUnavailableResponse()

  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const { id } = await params
    const body = await request.json()
    const { fileName, categoryId } = body

    // Verificar se existe E pertence ao usuário
    const existing = await prisma.transcription.findFirst({
      where: { id, userId: session.userId },
    })
    if (!existing) {
      return notFoundResponse('Transcricao')
    }

    // Montar dados de update
    const data: Record<string, unknown> = {}

    if (fileName !== undefined) {
      data.fileName = fileName
    }

    if (categoryId !== undefined) {
      // null = remover categoria, string = atribuir categoria
      if (categoryId !== null) {
        const category = await prisma.category.findFirst({
          where: {
            id: categoryId,
            OR: [
              { userId: session.userId },
              { userId: null, isDefault: true },
            ],
          },
        })
        if (!category) {
          return errorResponse('Categoria nao encontrada', 404)
        }
      }
      data.categoryId = categoryId
    }

    if (Object.keys(data).length === 0) {
      return errorResponse('Nenhum campo para atualizar')
    }

    const updated = await prisma.transcription.update({
      where: { id },
      data,
      include: {
        category: true,
        summary: true,
      },
    })

    return jsonResponse(mapTranscriptionToHistoryItem(updated))
  } catch (error) {
    console.error('Erro ao atualizar transcricao:', error)
    return errorResponse('Erro interno ao atualizar transcricao', 500)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  if (!prisma) return dbUnavailableResponse()

  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const { id } = await params

    const existing = await prisma.transcription.findFirst({
      where: { id, userId: session.userId },
    })
    if (!existing) {
      return notFoundResponse('Transcricao')
    }

    // Cascade deleta summary e audioFile automaticamente
    await prisma.transcription.delete({ where: { id } })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Erro ao excluir transcricao:', error)
    return errorResponse('Erro interno ao excluir transcricao', 500)
  }
}
