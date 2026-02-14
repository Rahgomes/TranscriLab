import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFoundResponse, dbUnavailableResponse } from '@/lib/api'
import { mapVersionToDetail } from '@/lib/mappers'

type RouteParams = { params: Promise<{ id: string; versionNumber: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const { id, versionNumber: versionStr } = await params
    const versionNumber = parseInt(versionStr, 10)

    if (isNaN(versionNumber) || versionNumber < 1) {
      return errorResponse('Numero de versao invalido')
    }

    const version = await prisma.transcriptionVersion.findUnique({
      where: {
        transcriptionId_versionNumber: {
          transcriptionId: id,
          versionNumber,
        },
      },
    })

    if (!version) {
      return notFoundResponse('Versao')
    }

    return jsonResponse(mapVersionToDetail(version))
  } catch (error) {
    console.error('Erro ao buscar versao:', error)
    return errorResponse('Erro interno ao buscar versao', 500)
  }
}
