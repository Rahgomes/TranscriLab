'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface PostRecordingActionsProps {
  fullText: string
  duration: number
  onSave: (editedText?: string) => void
  onRestart: () => void
  onDiscard: () => void
  isSaving?: boolean
  className?: string
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}min ${s}s`
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
}

export function PostRecordingActions({
  fullText,
  duration,
  onSave,
  onRestart,
  onDiscard,
  isSaving = false,
  className,
}: PostRecordingActionsProps) {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [showRestartDialog, setShowRestartDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(fullText)

  const displayText = isEditing ? editText : fullText

  function handleCancelEdit() {
    setEditText(fullText)
    setIsEditing(false)
  }

  function handleConfirmRestart() {
    setShowRestartDialog(false)
    onRestart()
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Transcript preview / edit */}
      <ScrollArea className="h-48 md:h-64 border rounded-xl">
        <div className="p-4">
          {isEditing ? (
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[180px] resize-none text-sm leading-relaxed border-0 p-0 focus-visible:ring-0"
              placeholder="Edite a transcrição..."
            />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {fullText || 'Nenhum texto transcrito.'}
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Metadata */}
      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Icon name="timer" size="sm" />
          {formatDuration(duration)}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="text_fields" size="sm" />
          {countWords(displayText)} palavras
        </span>
      </div>

      {/* Action buttons - reorganized in groups */}
      <div className="flex flex-col gap-3">
        {/* Primary action - full width on mobile */}
        <Button
          size="lg"
          onClick={() => onSave(isEditing ? editText : undefined)}
          disabled={isSaving || !displayText.trim()}
          className="rounded-xl gap-2 w-full"
        >
          <Icon name="save" size="md" />
          {isSaving ? 'Salvando...' : 'Salvar no Histórico'}
        </Button>

        {/* Secondary actions - grid layout */}
        <div className="grid grid-cols-2 gap-2">
          {isEditing ? (
            <Button
              variant="outline"
              size="default"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="rounded-xl gap-2"
            >
              <Icon name="close" size="sm" />
              Cancelar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="default"
              onClick={() => setIsEditing(true)}
              disabled={isSaving || !fullText.trim()}
              className="rounded-xl gap-2"
            >
              <Icon name="edit" size="sm" />
              Editar
            </Button>
          )}

          <Button
            variant="outline"
            size="default"
            onClick={() => setShowRestartDialog(true)}
            disabled={isSaving}
            className="rounded-xl gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Regravar
          </Button>
        </div>

        {/* Destructive action - separate row */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDiscardDialog(true)}
          disabled={isSaving}
          className="rounded-xl gap-2 text-muted-foreground hover:text-destructive"
        >
          <Icon name="delete" size="sm" />
          Descartar gravação
        </Button>
      </div>

      {/* Discard confirmation */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Descartar gravação?</DialogTitle>
            <DialogDescription>
              A gravação e a transcrição serão perdidas permanentemente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDiscardDialog(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDiscardDialog(false)
                onDiscard()
              }}
              className="rounded-xl"
            >
              Descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restart confirmation */}
      <Dialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Regravar?</DialogTitle>
            <DialogDescription>
              A gravação e a transcrição atuais serão descartadas. Deseja iniciar uma nova gravação?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestartDialog(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRestart}
              className="rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Regravar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
