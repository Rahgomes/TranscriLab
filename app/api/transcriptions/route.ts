import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, parseSearchParams, dbUnavailableResponse } from '@/lib/api'
import { mapTranscriptionToHistoryItem } from '@/lib/mappers'

export async function POST(request: NextRequest) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const body = await request.json()
    const {
      fileName,
      originalFileName,
      fileSize,
      duration,
      transcription: text,
      hasAudio,
      audioMimeType,
      categoryId,
    } = body

    if (!fileName || !originalFileName || !fileSize || !text) {
      return errorResponse('Campos obrigatorios: fileName, originalFileName, fileSize, transcription')
    }

    // Validar categoria se fornecida
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } })
      if (!category) {
        return errorResponse('Categoria nao encontrada', 404)
      }
    }

    const created = await prisma.transcription.create({
      data: {
        fileName,
        originalFileName,
        fileSize,
        duration: duration ?? null,
        transcription: text,
        hasAudio: hasAudio ?? false,
        audioMimeType: audioMimeType ?? null,
        categoryId: categoryId ?? null,
      },
      include: {
        category: true,
        summary: true,
      },
    })

    return jsonResponse(mapTranscriptionToHistoryItem(created), 201)
  } catch (error) {
    console.error('Erro ao criar transcricao:', error)
    return errorResponse('Erro interno ao criar transcricao', 500)
  }
}

export async function GET(request: NextRequest) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const { searchParams } = new URL(request.url)
    const { search, categoryId, sortBy, sortOrder, cursor, limit } =
      parseSearchParams(searchParams)

    // Montar filtros
    const where: Record<string, unknown> = {}

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { transcription: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Montar ordenacao
    const orderByMap = {
      date: { createdAt: sortOrder },
      name: { fileName: sortOrder },
      size: { fileSize: sortOrder },
    }
    const orderBy = orderByMap[sortBy] || orderByMap.date

    // Buscar total
    const total = await prisma.transcription.count({ where })

    // Buscar items com cursor pagination
    const items = await prisma.transcription.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      include: {
        category: true,
        summary: true,
      },
    })

    const hasMore = items.length > limit
    const nextCursor = hasMore ? items[limit - 1].id : null
    const results = hasMore ? items.slice(0, -1) : items

    return jsonResponse({
      items: results.map(mapTranscriptionToHistoryItem),
      nextCursor,
      total,
    })
  } catch (error) {
    console.error('Erro ao listar transcricoes:', error)
    return errorResponse('Erro interno ao listar transcricoes', 500)
  }
}
