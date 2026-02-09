'use client'

import { FileText, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  hasFilters?: boolean
}

export function EmptyState({ hasFilters = false }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Tente ajustar os filtros ou buscar por outros termos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Nenhuma transcricao ainda</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Quando voce transcrever um audio, ele aparecera aqui automaticamente.
        </p>
      </CardContent>
    </Card>
  )
}
