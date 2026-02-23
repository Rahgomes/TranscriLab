'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import type { ApiProvider } from '../types'
import { PROVIDER_LABELS, PROVIDER_COLORS } from '../types'
import { formatCost } from '../lib/pricing'

interface ModelUsage {
  model: string
  provider: ApiProvider
  requests: number
  tokens: number
  cost: number
  audioMinutes: number
}

interface UsageByModelProps {
  data: ModelUsage[]
  selectedProvider: ApiProvider | 'ALL'
}

export function UsageByModel({ data, selectedProvider }: UsageByModelProps) {
  const filteredData =
    selectedProvider === 'ALL'
      ? data
      : data.filter((d) => d.provider === selectedProvider)

  // Ordenar por custo
  const sortedData = [...filteredData].sort((a, b) => b.cost - a.cost)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon name="model_training" size="md" className="text-primary" />
          Uso por Modelo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedData.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum uso registrado
            </p>
          ) : (
            sortedData.map((item, index) => (
              <div
                key={`${item.provider}-${item.model}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground w-6">
                    #{index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.model}</span>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${PROVIDER_COLORS[item.provider]}20`,
                          color: PROVIDER_COLORS[item.provider],
                        }}
                      >
                        {PROVIDER_LABELS[item.provider]}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.requests} req • {item.tokens.toLocaleString()} tokens
                      {item.audioMinutes > 0 && ` • ${item.audioMinutes.toFixed(1)} min`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{formatCost(item.cost)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
