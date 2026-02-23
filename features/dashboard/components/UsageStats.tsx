'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import type { ApiProvider } from '../types'
import { PROVIDER_COLORS, PROVIDER_LABELS } from '../types'
import { formatCost, formatCostBRL } from '../lib/pricing'

interface ProviderStats {
  provider: ApiProvider
  requests: number
  tokens: number
  cost: number
  audioMinutes: number
}

interface UsageStatsProps {
  summary: {
    totalRequests: number
    totalTokens: number
    totalCost: number
    totalAudioMinutes: number
  }
  byProvider: ProviderStats[]
  selectedProvider: ApiProvider | 'ALL'
}

export function UsageStats({ summary, byProvider, selectedProvider }: UsageStatsProps) {
  const getProviderData = (provider: ApiProvider) => {
    return byProvider.find((p) => p.provider === provider) || {
      provider,
      requests: 0,
      tokens: 0,
      cost: 0,
      audioMinutes: 0,
    }
  }

  const displayData =
    selectedProvider === 'ALL'
      ? summary
      : {
          totalRequests: getProviderData(selectedProvider).requests,
          totalTokens: getProviderData(selectedProvider).tokens,
          totalCost: getProviderData(selectedProvider).cost,
          totalAudioMinutes: getProviderData(selectedProvider).audioMinutes,
        }

  const stats = [
    {
      label: 'Total de Requisições',
      value: displayData.totalRequests.toLocaleString(),
      icon: 'api',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Tokens Utilizados',
      value: displayData.totalTokens.toLocaleString(),
      icon: 'token',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Minutos Transcritos',
      value: `${displayData.totalAudioMinutes.toFixed(1)} min`,
      icon: 'mic',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Custo Estimado',
      value: formatCost(displayData.totalCost),
      subValue: formatCostBRL(displayData.totalCost),
      icon: 'payments',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <Icon name={stat.icon} size="lg" className={stat.color} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                {stat.subValue && (
                  <p className="text-xs text-muted-foreground">{stat.subValue}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface ProviderComparisonProps {
  byProvider: ProviderStats[]
}

export function ProviderComparison({ byProvider }: ProviderComparisonProps) {
  const total = byProvider.reduce((acc, p) => acc + p.cost, 0)

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icon name="compare" size="md" className="text-primary" />
          Comparação por Provider
        </h3>
        <div className="space-y-4">
          {byProvider.map((provider) => {
            const percentage = total > 0 ? (provider.cost / total) * 100 : 0
            return (
              <div key={provider.provider} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PROVIDER_COLORS[provider.provider] }}
                    />
                    <span className="font-medium">
                      {PROVIDER_LABELS[provider.provider]}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatCost(provider.cost)}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: PROVIDER_COLORS[provider.provider],
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{provider.requests} requisições</span>
                  <span>{provider.tokens.toLocaleString()} tokens</span>
                  <span>{provider.audioMinutes.toFixed(1)} min áudio</span>
                </div>
              </div>
            )
          })}

          {byProvider.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Nenhum uso registrado ainda
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
