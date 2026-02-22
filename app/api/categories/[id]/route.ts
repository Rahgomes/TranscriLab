import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFoundResponse, dbUnavailableResponse } from '@/lib/api'
import { mapCategoryToHistoryCategory } from '@/lib/mappers'
import { getSession } from '@/lib/auth'

type RouteParams = { params: Promise<{ id: string }> }

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
    const { name, color } = body

    // Verificar se existe E pertence ao usuário (não pode editar categorias padrão)
    const existing = await prisma.category.findFirst({
      where: {
        id,
        userId: session.userId,
        isDefault: false,
      },
    })
    if (!existing) {
      return notFoundResponse('Categoria')
    }

    const data: Record<string, unknown> = {}

    if (name !== undefined) {
      data.name = name
    }

    if (color !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
        return errorResponse('Cor deve estar no formato hex (#RRGGBB)')
      }
      data.color = color
    }

    if (Object.keys(data).length === 0) {
      return errorResponse('Nenhum campo para atualizar')
    }

    const updated = await prisma.category.update({
      where: { id },
      data,
    })

    return jsonResponse(mapCategoryToHistoryCategory(updated))
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    return errorResponse('Erro interno ao atualizar categoria', 500)
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

    // Verificar se existe E pertence ao usuário (não pode deletar categorias padrão)
    const existing = await prisma.category.findFirst({
      where: {
        id,
        userId: session.userId,
        isDefault: false,
      },
    })
    if (!existing) {
      return notFoundResponse('Categoria')
    }

    // onDelete: SetNull - transcricoes perdem a referencia automaticamente
    await prisma.category.delete({ where: { id } })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    return errorResponse('Erro interno ao excluir categoria', 500)
  }
}
