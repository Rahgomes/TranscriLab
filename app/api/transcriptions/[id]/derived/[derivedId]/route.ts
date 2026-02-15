import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFoundResponse, dbUnavailableResponse } from '@/lib/api'

type RouteParams = { params: Promise<{ id: string; derivedId: string }> }

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    if (!prisma) return dbUnavailableResponse()

    const { id, derivedId } = await params

    // Verificar se o conteúdo derivado existe e pertence à transcrição
    const derived = await prisma.derivedContent.findFirst({
      where: { id: derivedId, transcriptionId: id },
    })

    if (!derived) {
      return notFoundResponse('Conteúdo derivado')
    }

    await prisma.derivedContent.delete({
      where: { id: derivedId },
    })

    return jsonResponse({ success: true })
  } catch (error) {
    console.error('Erro ao excluir conteúdo derivado:', error)
    return errorResponse('Erro ao excluir conteúdo derivado', 500)
  }
}
