'use client'

import { useState, useMemo, useEffect } from 'react'
import { Copy, Check, Home, Pencil, RotateCcw, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { SegmentedTranscript } from '@/features/history/components/SegmentedTranscript'
import type { TranscriptionSegment } from '@/features/transcription/types'
import { extractSpeakerInfo } from '@/lib/segments'

interface TranscriptionCardProps {
  text: string
  fileName?: string
  segments?: TranscriptionSegment[]
  hasDiarization?: boolean
  onClear: () => void
  onTextChange?: (newText: string) => void
  onRestart?: () => void
}

export function TranscriptionCard({ text, fileName, segments, hasDiarization, onClear, onTextChange, onRestart }: TranscriptionCardProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(text)
  const [showRestartDialog, setShowRestartDialog] = useState(false)

  const speakers = useMemo(
    () => (segments && segments.length > 0 ? extractSpeakerInfo(segments) : []),
    [segments],
  )

  const showSegmented = hasDiarization && segments && segments.length > 0

  // Sync editText when text prop changes and not editing
  useEffect(() => {
    if (!isEditing) {
      setEditText(text)
    }
  }, [text, isEditing])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(isEditing ? editText : text)
      setCopied(true)
      toast.success('Copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Erro ao copiar texto')
    }
  }

  function handleSaveEdit() {
    onTextChange?.(editText)
    setIsEditing(false)
  }

  function handleCancelEdit() {
    setEditText(text)
    setIsEditing(false)
  }

  function handleConfirmRestart() {
    setShowRestartDialog(false)
    onRestart?.()
  }

  const hasChanges = editText !== text

  return (
    <>
      <CardSpotlight className="animate-slide-up p-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
          <CardTitle className="text-lg font-semibold">
            Transcrição
          </CardTitle>
          {fileName && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {fileName}
            </p>
          )}
        </CardHeader>

        <CardContent className="px-6">
          <div className="max-h-[500px] overflow-y-auto rounded-lg">
            {isEditing ? (
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[300px] resize-none text-base leading-relaxed font-serif"
                placeholder="Edite a transcrição..."
              />
            ) : showSegmented ? (
              <SegmentedTranscript
                segments={segments}
                speakers={speakers}
                activeSegmentIndex={-1}
                onSegmentClick={() => {}}
              />
            ) : (
              <article className="prose prose-slate dark:prose-invert prose-lg max-w-none space-y-6 p-4">
                {text.split(/\n\n+/).map((paragraph, index) => (
                  <p
                    key={index}
                    className={`font-serif text-lg leading-relaxed ${index === 0 ? 'drop-cap' : ''}`}
                  >
                    {paragraph}
                  </p>
                ))}
              </article>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 px-6 pb-6">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!hasChanges}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar edição
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>

              {onTextChange && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar transcrição
                </Button>
              )}

              {onRestart && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRestartDialog(true)}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Nova Transcrição
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao início
              </Button>
            </>
          )}
        </CardFooter>
      </CardSpotlight>

      {/* Restart confirmation dialog */}
      <Dialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova transcrição?</DialogTitle>
            <DialogDescription>
              A transcrição atual será descartada permanentemente. Deseja continuar?
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
              Descartar e recomeçar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
