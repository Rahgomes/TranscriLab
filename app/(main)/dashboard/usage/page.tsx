'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@/components/ui/icon'
import {
  UsageChart,
  UsageStats,
  ProviderComparison,
  ProviderSelect,
  UsageByModel,
  type ApiProvider,
} from '@/features/dashboard'

interface UsageData {
  summary: {
    totalRequests: number
    totalTokens: number
    totalCost: number
    totalAudioMinutes: number
  }
  byProvider: {
    provider: ApiProvider
    requests: number
    tokens: number
    cost: number
    audioMinutes: number
  }[]
  byOperation: {
    operation: string
    requests: number
    tokens: number
    cost: number
  }[]
  byModel: {
    model: string
    provider: ApiProvider
    requests: number
    tokens: number
    cost: number
    audioMinutes: number
  }[]
  daily: {
    date: string
    provider: string
    requests: number
    tokens: number
    cost: number
    audioMinutes: number
  }[]
}

export default function UsagePage() {
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider | 'ALL'>('ALL')
  const [selectedMetric, setSelectedMetric] = useState<'requests' | 'tokens' | 'cost' | 'audioMinutes'>('cost')
  const [data, setData] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsage() {
      try {
        setIsLoading(true)
        const res = await fetch('/api/usage')
        if (!res.ok) {
          throw new Error('Erro ao carregar dados')
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsage()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[350px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon name="error" size="xl" className="text-destructive mb-4" />
            <p className="text-lg font-medium">Erro ao carregar dados</p>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Icon name="analytics" size="lg" className="text-primary" />
            API Usage
          </h1>
          <p className="text-muted-foreground">
            Monitoramento de uso das APIs de IA
          </p>
        </div>
        <ProviderSelect
          value={selectedProvider}
          onValueChange={setSelectedProvider}
        />
      </div>

      {/* Stats Cards */}
      <UsageStats
        summary={data.summary}
        byProvider={data.byProvider}
        selectedProvider={selectedProvider}
      />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs
            value={selectedMetric}
            onValueChange={(v) => setSelectedMetric(v as typeof selectedMetric)}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="cost">Custo</TabsTrigger>
              <TabsTrigger value="requests">Requisições</TabsTrigger>
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="audioMinutes">Áudio</TabsTrigger>
            </TabsList>
            <TabsContent value={selectedMetric} className="mt-0">
              <UsageChart
                data={data.daily}
                selectedProvider={selectedProvider}
                metric={selectedMetric}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Provider Comparison */}
        <div>
          <ProviderComparison byProvider={data.byProvider} />
        </div>
      </div>

      {/* Usage by Model */}
      <UsageByModel data={data.byModel} selectedProvider={selectedProvider} />

      {/* Empty state helper */}
      {data.summary.totalRequests === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon name="monitoring" size="xl" className="text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum uso registrado ainda</p>
            <p className="text-muted-foreground text-center max-w-md">
              Os dados de uso serão exibidos aqui conforme você utilizar as funcionalidades
              de transcrição, resumo e geração de conteúdo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
