import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, dbUnavailableResponse } from '@/lib/api'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') || 'day' // day, week, month

    // Construir filtros
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      userId: session.userId,
    }

    if (provider) {
      where.provider = provider
    }

    if (startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(endDate),
      }
    }

    // Buscar uso total
    const totalUsage = await prisma.apiUsage.aggregate({
      where,
      _sum: {
        totalTokens: true,
        estimatedCost: true,
        audioDuration: true,
      },
      _count: true,
    })

    // Buscar uso por provider
    const byProvider = await prisma.apiUsage.groupBy({
      by: ['provider'],
      where: { userId: session.userId },
      _sum: {
        totalTokens: true,
        estimatedCost: true,
        audioDuration: true,
      },
      _count: true,
    })

    // Buscar uso por operação
    const byOperation = await prisma.apiUsage.groupBy({
      by: ['operation'],
      where,
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
      _count: true,
    })

    // Buscar uso por modelo
    const byModel = await prisma.apiUsage.groupBy({
      by: ['model', 'provider'],
      where,
      _sum: {
        totalTokens: true,
        estimatedCost: true,
        audioDuration: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          estimatedCost: 'desc',
        },
      },
      take: 10,
    })

    // Buscar uso diário (últimos 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyUsage = await prisma.$queryRaw<
      { date: Date; provider: string; requests: bigint; tokens: bigint; cost: number; audio_minutes: number }[]
    >`
      SELECT 
        DATE(created_at) as date,
        provider,
        COUNT(*)::bigint as requests,
        COALESCE(SUM(total_tokens), 0)::bigint as tokens,
        COALESCE(SUM(estimated_cost), 0) as cost,
        COALESCE(SUM(audio_duration) / 60, 0) as audio_minutes
      FROM api_usage
      WHERE user_id = ${session.userId}
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at), provider
      ORDER BY date ASC
    `

    return jsonResponse({
      summary: {
        totalRequests: totalUsage._count,
        totalTokens: totalUsage._sum.totalTokens || 0,
        totalCost: totalUsage._sum.estimatedCost || 0,
        totalAudioMinutes: (totalUsage._sum.audioDuration || 0) / 60,
      },
      byProvider: byProvider.map((p) => ({
        provider: p.provider,
        requests: p._count,
        tokens: p._sum.totalTokens || 0,
        cost: p._sum.estimatedCost || 0,
        audioMinutes: (p._sum.audioDuration || 0) / 60,
      })),
      byOperation: byOperation.map((o) => ({
        operation: o.operation,
        requests: o._count,
        tokens: o._sum.totalTokens || 0,
        cost: o._sum.estimatedCost || 0,
      })),
      byModel: byModel.map((m) => ({
        model: m.model,
        provider: m.provider,
        requests: m._count,
        tokens: m._sum.totalTokens || 0,
        cost: m._sum.estimatedCost || 0,
        audioMinutes: (m._sum.audioDuration || 0) / 60,
      })),
      daily: dailyUsage.map((d) => ({
        date: d.date.toISOString().split('T')[0],
        provider: d.provider,
        requests: Number(d.requests),
        tokens: Number(d.tokens),
        cost: d.cost,
        audioMinutes: d.audio_minutes,
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar usage:', error)
    return errorResponse('Erro interno', 500)
  }
}
