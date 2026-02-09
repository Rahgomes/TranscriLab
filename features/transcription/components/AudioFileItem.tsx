'use client'

import { X, RotateCcw, Check, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import type { AudioFileState, FileStatus } from '../types'

interface AudioFileItemProps {
  file: AudioFileState
  onRemove: (id: string) => void
  onRetry?: (id: string) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getStatusConfig(status: FileStatus) {
  const configs = {
    pending: { label: 'Aguardando', variant: 'secondary' as const, icon: null },
    uploading: { label: 'Enviando', variant: 'default' as const, icon: Loader2 },
    transcribing: { label: 'Transcrevendo', variant: 'default' as const, icon: Loader2 },
    completed: { label: 'Concluído', variant: 'success' as const, icon: Check },
    error: { label: 'Erro', variant: 'destructive' as const, icon: AlertCircle },
  }
  return configs[status]
}

export function AudioFileItem({ file, onRemove, onRetry }: AudioFileItemProps) {
  const statusConfig = getStatusConfig(file.status)
  const StatusIcon = statusConfig.icon
  const isProcessing = file.status === 'uploading' || file.status === 'transcribing'

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <Badge variant={statusConfig.variant} className="shrink-0">
                {StatusIcon && (
                  <StatusIcon className={cn(
                    'w-3 h-3 mr-1',
                    isProcessing && 'animate-spin'
                  )} />
                )}
                {statusConfig.label}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              {formatFileSize(file.size)}
            </p>

            {isProcessing && (
              <div className="space-y-1">
                <Progress value={file.progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground text-right">
                  {file.progress}%
                </p>
              </div>
            )}

            {file.status === 'error' && file.error && (
              <p className="text-xs text-destructive mt-2">{file.error}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {file.status === 'error' && onRetry && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRetry(file.id)}
                className="h-8 w-8"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}

            {(file.status === 'pending' || file.status === 'error' || file.status === 'completed') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(file.id)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
