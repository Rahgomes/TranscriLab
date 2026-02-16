import { NextRequest } from 'next/server'
import type { AudioEventType } from '@prisma/client'
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
      hasDiarization,
      speakerCount,
      segments,
      events,
      hasEvents,
      source,
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
        originalTranscriptionText: text,
        currentVersion: 0,
        hasAudio: hasAudio ?? false,
        audioMimeType: audioMimeType ?? null,
        categoryId: categoryId ?? null,
        hasDiarization: hasDiarization ?? false,
        speakerCount: speakerCount ?? null,
        hasEvents: hasEvents ?? false,
        source: source ?? 'upload',
        segments: Array.isArray(segments) && segments.length > 0
          ? {
              createMany: {
                data: segments.map((s: { index: number; speaker: string; text: string; startTime: number; endTime: number }, i: number) => ({
                  index: s.index ?? i,
                  speaker: s.speaker,
                  text: s.text,
                  originalText: s.text,
                  startTime: s.startTime,
                  endTime: s.endTime,
                })),
              },
            }
          : undefined,
        events: Array.isArray(events) && events.length > 0
          ? {
              createMany: {
                data: events.map((e: { type: string; startTime: number; endTime: number; confidence: number; description?: string; source: string }) => ({
                  type: e.type as AudioEventType,
                  startTime: e.startTime,
                  endTime: e.endTime,
                  confidence: e.confidence,
                  description: e.description ?? null,
                  source: e.source,
                })),
              },
            }
          : undefined,
      },
      include: {
        category: true,
        summary: true,
      },
    })

    // Type assertion needed because Prisma loses type inference with complex conditional createMany
    return jsonResponse(mapTranscriptionToHistoryItem(created as typeof created & { category: typeof created.category; summary: typeof created.summary }), 201)
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
