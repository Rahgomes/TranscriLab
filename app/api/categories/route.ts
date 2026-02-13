import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, dbUnavailableResponse } from '@/lib/api'
import { mapCategoryToHistoryCategory } from '@/lib/mappers'

export async function GET() {
  if (!prisma) return dbUnavailableResponse()

  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        _count: {
          select: { transcriptions: true },
        },
      },
    })

    return jsonResponse({
      categories: categories.map((c) => ({
        ...mapCategoryToHistoryCategory(c),
        isDefault: c.isDefault,
        _count: c._count,
      })),
    })
  } catch (error) {
    console.error('Erro ao listar categorias:', error)
    return errorResponse('Erro interno ao listar categorias', 500)
  }
}

export async function POST(request: NextRequest) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const body = await request.json()
    const { name, color } = body

    if (!name || !color) {
      return errorResponse('Campos obrigatorios: name, color')
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return errorResponse('Cor deve estar no formato hex (#RRGGBB)')
    }

    const category = await prisma.category.create({
      data: {
        name,
        color,
        isDefault: false,
      },
    })

    return jsonResponse(mapCategoryToHistoryCategory(category), 201)
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return errorResponse('Erro interno ao criar categoria', 500)
  }
}
