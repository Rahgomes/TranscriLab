'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { useHistoryStore } from '@/store'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface RecentTranscriptionsProps {
  onSelectItem?: (id: string) => void
  limit?: number
}

export function RecentTranscriptions({ onSelectItem, limit = 6 }: RecentTranscriptionsProps) {
  const items = useHistoryStore((state) => state.items)
  const categories = useHistoryStore((state) => state.categories)

  const recentItems = items.slice(0, limit)

  if (recentItems.length === 0) {
    return null
  }

  function getCategoryInfo(categoryId?: string) {
    if (!categoryId) return null
    return categories.find((c) => c.id === categoryId)
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Transcritos Recentemente
        </h2>
        <Link
          href="/history"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Ver tudo
          <Icon name="arrow_forward" size="sm" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentItems.map((item) => {
          const category = getCategoryInfo(item.category)

          return (
            <CardSpotlight
              key={item.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => onSelectItem?.(item.id)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon
                    name="audio_file"
                    size="md"
                    className="text-muted-foreground"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title */}
                  <h3 className="font-medium truncate group-hover:text-foreground transition-colors">
                    {item.fileName}
                  </h3>

                  {/* Category badge */}
                  {category && (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color,
                      }}
                    >
                      {category.name}
                    </Badge>
                  )}

                  {/* Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.transcription.slice(0, 100)}...
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    <span>·</span>
                    <span>{formatFileSize(item.fileSize)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {!item.summary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectItem?.(item.id)
                        }}
                      >
                        <Icon name="auto_awesome" size="sm" className="mr-1" />
                        Gerar Resumo
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectItem?.(item.id)
                      }}
                    >
                      Ver Completo
                    </Button>
                  </div>
                </div>
              </div>
            </CardSpotlight>
          )
        })}
      </div>
    </section>
  )
}
