'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ApiProvider } from '../types'
import { PROVIDER_LABELS, PROVIDER_COLORS } from '../types'

interface ProviderSelectProps {
  value: ApiProvider | 'ALL'
  onValueChange: (value: ApiProvider | 'ALL') => void
}

export function ProviderSelect({ value, onValueChange }: ProviderSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Selecione o provider" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-amber-500" />
            Todos os Providers
          </div>
        </SelectItem>
        {(Object.keys(PROVIDER_LABELS) as ApiProvider[]).map((provider) => (
          <SelectItem key={provider} value={provider}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PROVIDER_COLORS[provider] }}
              />
              {PROVIDER_LABELS[provider]}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
