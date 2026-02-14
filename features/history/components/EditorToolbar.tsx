'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'

interface EditorToolbarProps {
  isDirty: boolean
  isSaving: boolean
  currentVersion: number
  onSave: () => void
  onDiscard: () => void
  onOpenHistory: () => void
}

export function EditorToolbar({
  isDirty,
  isSaving,
  currentVersion,
  onSave,
  onDiscard,
  onOpenHistory,
}: EditorToolbarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2 rounded-lg border transition-colors',
        isDirty
          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
          : 'bg-muted/50 border-border',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon name="edit_note" className="text-primary" size="sm" />
        <span className="text-sm font-medium">Modo de edicao</span>
        {isDirty && (
          <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
            Alteracoes nao salvas
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {currentVersion > 0 && (
          <Button variant="outline" size="sm" onClick={onOpenHistory}>
            <Icon name="history" size="xs" />
            <span className="hidden sm:inline ml-1">Historico</span>
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={isSaving}>
          Descartar
        </Button>

        <Button
          size="sm"
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className={cn(isDirty && !isSaving && 'animate-pulse')}
        >
          {isSaving ? (
            <>
              <Icon name="sync" size="xs" className="animate-spin" />
              <span className="ml-1">Salvando...</span>
            </>
          ) : (
            <>
              <Icon name="save" size="xs" />
              <span className="ml-1">Salvar alteracoes</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
