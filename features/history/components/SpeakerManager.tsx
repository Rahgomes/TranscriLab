'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/ui/icon'
import { SpeakerBadge } from './SpeakerBadge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { SpeakerInfo } from '@/features/history/types/segments'
import { formatTimestamp } from '@/lib/segments'

interface SpeakerManagerProps {
  speakers: SpeakerInfo[]
  transcriptionId: string
  onUpdate: () => void
}

export function SpeakerManager({ speakers, transcriptionId, onUpdate }: SpeakerManagerProps) {
  const [editingSpeaker, setEditingSpeaker] = useState<SpeakerInfo | null>(null)
  const [newName, setNewName] = useState('')
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([])
  const [isMerging, setIsMerging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [mergeName, setMergeName] = useState('')

  if (speakers.length === 0) return null

  const handleRename = async () => {
    if (!editingSpeaker || !newName.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/transcriptions/${transcriptionId}/speakers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          speakerId: editingSpeaker.id,
          newName: newName.trim(),
        }),
      })

      if (!res.ok) throw new Error('Erro ao renomear')

      toast.success(`Speaker renomeado para "${newName.trim()}"`)
      setEditingSpeaker(null)
      setNewName('')
      onUpdate()
    } catch (error) {
      toast.error('Erro ao renomear speaker')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMerge = async () => {
    if (selectedForMerge.length < 2 || !mergeName.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/transcriptions/${transcriptionId}/speakers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'merge',
          speakerIds: selectedForMerge,
          newName: mergeName.trim(),
        }),
      })

      if (!res.ok) throw new Error('Erro ao mesclar')

      toast.success(`Speakers mesclados como "${mergeName.trim()}"`)
      setSelectedForMerge([])
      setIsMerging(false)
      setMergeDialogOpen(false)
      setMergeName('')
      onUpdate()
    } catch (error) {
      toast.error('Erro ao mesclar speakers')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMergeSelection = (speakerId: string) => {
    setSelectedForMerge((prev) =>
      prev.includes(speakerId)
        ? prev.filter((id) => id !== speakerId)
        : [...prev, speakerId]
    )
  }

  const startMerge = () => {
    setIsMerging(true)
    setSelectedForMerge([])
  }

  const cancelMerge = () => {
    setIsMerging(false)
    setSelectedForMerge([])
  }

  const openMergeDialog = () => {
    if (selectedForMerge.length >= 2) {
      // Sugerir nome do primeiro speaker selecionado
      const firstSpeaker = speakers.find((s) => s.id === selectedForMerge[0])
      setMergeName(firstSpeaker?.displayName || '')
      setMergeDialogOpen(true)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="group" size="md" className="text-primary" />
              Participantes ({speakers.length})
            </CardTitle>
            {!isMerging ? (
              <Button
                variant="outline"
                size="sm"
                onClick={startMerge}
                disabled={speakers.length < 2}
              >
                <Icon name="call_merge" size="sm" className="mr-1" />
                Mesclar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={openMergeDialog}
                  disabled={selectedForMerge.length < 2}
                >
                  <Icon name="check" size="sm" className="mr-1" />
                  Confirmar ({selectedForMerge.length})
                </Button>
                <Button variant="ghost" size="sm" onClick={cancelMerge}>
                  Cancelar
                </Button>
              </div>
            )}
          </div>
          {isMerging && (
            <p className="text-xs text-muted-foreground mt-2">
              Selecione 2 ou mais speakers para mesclar em um só
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {speakers.map((speaker) => (
            <div
              key={speaker.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isMerging ? 'hover:bg-accent cursor-pointer' : ''
              } ${selectedForMerge.includes(speaker.id) ? 'bg-accent' : ''}`}
              onClick={() => isMerging && toggleMergeSelection(speaker.id)}
            >
              {isMerging && (
                <Checkbox
                  checked={selectedForMerge.includes(speaker.id)}
                  onCheckedChange={() => toggleMergeSelection(speaker.id)}
                />
              )}
              <div className="flex-1 flex items-center justify-between">
                <SpeakerBadge
                  displayName={speaker.displayName}
                  color={speaker.color}
                  size="md"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(speaker.totalDuration)} • {speaker.segmentCount} seg.
                  </span>
                  {!isMerging && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingSpeaker(speaker)
                        setNewName(speaker.displayName)
                      }}
                    >
                      <Icon name="edit" size="sm" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialog de Renomear */}
      <Dialog open={!!editingSpeaker} onOpenChange={() => setEditingSpeaker(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Speaker</DialogTitle>
            <DialogDescription>
              Altere o nome de exibição deste participante
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome do participante"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingSpeaker(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRename} disabled={isLoading || !newName.trim()}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Mesclar */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mesclar Speakers</DialogTitle>
            <DialogDescription>
              Os {selectedForMerge.length} speakers selecionados serão combinados em um só.
              Todos os segmentos serão atribuídos ao novo nome.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome do participante mesclado"
              value={mergeName}
              onChange={(e) => setMergeName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMerge()}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMergeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMerge} disabled={isLoading || !mergeName.trim()}>
              {isLoading ? 'Mesclando...' : 'Mesclar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
