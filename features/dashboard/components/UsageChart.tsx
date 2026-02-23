'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import type { ApiProvider } from '../types'
import { PROVIDER_COLORS, PROVIDER_LABELS } from '../types'

interface DailyData {
  date: string
  provider: string
  requests: number
  tokens: number
  cost: number
  audioMinutes: number
}

interface UsageChartProps {
  data: DailyData[]
  selectedProvider: ApiProvider | 'ALL'
  metric: 'requests' | 'tokens' | 'cost' | 'audioMinutes'
}

const METRIC_LABELS = {
  requests: 'Requisições',
  tokens: 'Tokens',
  cost: 'Custo (USD)',
  audioMinutes: 'Minutos de Áudio',
}

export function UsageChart({ data, selectedProvider, metric }: UsageChartProps) {
  // Agrupar dados por data
  const groupedData = data.reduce(
    (acc, item) => {
      const existing = acc.find((d) => d.date === item.date)
      if (existing) {
        if (item.provider === 'OPENAI') {
          existing.OPENAI = (existing.OPENAI || 0) + item[metric]
        } else {
          existing.GROQ = (existing.GROQ || 0) + item[metric]
        }
      } else {
        acc.push({
          date: item.date,
          OPENAI: item.provider === 'OPENAI' ? item[metric] : 0,
          GROQ: item.provider === 'GROQ' ? item[metric] : 0,
        })
      }
      return acc
    },
    [] as { date: string; OPENAI: number; GROQ: number }[]
  )

  // Ordenar por data
  groupedData.sort((a, b) => a.date.localeCompare(b.date))

  // Formatar data para exibição
  const formattedData = groupedData.map((d) => ({
    ...d,
    dateFormatted: new Date(d.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    }),
  }))

  const formatValue = (value: number) => {
    if (metric === 'cost') {
      return `$${value.toFixed(4)}`
    }
    if (metric === 'audioMinutes') {
      return `${value.toFixed(1)} min`
    }
    return value.toLocaleString()
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon name="show_chart" size="md" className="text-primary" />
          {METRIC_LABELS[metric]} - Últimos 30 dias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorOpenAI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PROVIDER_COLORS.OPENAI} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={PROVIDER_COLORS.OPENAI} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGroq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PROVIDER_COLORS.GROQ} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={PROVIDER_COLORS.GROQ} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateFormatted"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  metric === 'cost' ? `$${value.toFixed(2)}` : value.toLocaleString()
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => [
                  formatValue(value as number),
                  PROVIDER_LABELS[name as ApiProvider] || name,
                ]}
              />
              <Legend
                formatter={(value) => PROVIDER_LABELS[value as ApiProvider] || value}
              />
              {(selectedProvider === 'ALL' || selectedProvider === 'OPENAI') && (
                <Area
                  type="monotone"
                  dataKey="OPENAI"
                  stroke={PROVIDER_COLORS.OPENAI}
                  fillOpacity={1}
                  fill="url(#colorOpenAI)"
                  strokeWidth={2}
                />
              )}
              {(selectedProvider === 'ALL' || selectedProvider === 'GROQ') && (
                <Area
                  type="monotone"
                  dataKey="GROQ"
                  stroke={PROVIDER_COLORS.GROQ}
                  fillOpacity={1}
                  fill="url(#colorGroq)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
