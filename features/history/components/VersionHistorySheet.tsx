'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Icon } from '@/components/ui/icon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { VersionSummary, VersionDetail } from '@/features/history/types/versions'
import { VersionDiffView } from './VersionDiffView'

interface VersionHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  versions: VersionSummary[]
  isLoading: boolean
  isLoadingDetail: boolean
  isRestoring: boolean
  selectedVersion: VersionDetail | null
  createdAt: string
  onFetchVersions: () => void
  onFetchSnapshot: (versionNumber: number) => void
  onRestore: (versionNumber: number) => void
  onClearSelectedVersion: () => void
  currentTranscriptionText: string
  currentSegments: Array<{ index: number; speaker: string; text: string }>
}

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoDate
  }
}

export function VersionHistorySheet({
  open,
  onOpenChange,
  versions,
  isLoading,
  isLoadingDetail,
  isRestoring,
  selectedVersion,
  createdAt,
  onFetchVersions,
  onFetchSnapshot,
  onRestore,
  onClearSelectedVersion,
  currentTranscriptionText,
  currentSegments,
}: VersionHistorySheetProps) {
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      onFetchVersions()
    }
  }, [open, onFetchVersions])

  const handleRestore = (versionNumber: number) => {
    setConfirmRestore(versionNumber)
  }

  const confirmRestoreVersion = () => {
    if (confirmRestore !== null) {
      onRestore(confirmRestore)
      setConfirmRestore(null)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-lg w-full">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Icon name="history" size="sm" />
              Historico de Edicoes
              {versions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {versions.length} {versions.length === 1 ? 'versao' : 'versoes'}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              Veja e restaure versoes anteriores da transcricao.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)] mt-4 pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-36" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : selectedVersion ? (
              /* Diff view */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelectedVersion}
                  >
                    <Icon name="arrow_back" size="xs" />
                    <span className="ml-1">Voltar</span>
                  </Button>
                  <Badge variant="outline">
                    Versao #{selectedVersion.versionNumber}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground">
                  {formatDate(selectedVersion.editedAt)} — {selectedVersion.changesSummary}
                </div>

                <Separator />

                <VersionDiffView
                  oldSegments={selectedVersion.snapshot.segments.map((s) => ({
                    index: s.index,
                    speaker: s.speaker,
                    text: s.text,
                  }))}
                  newSegments={currentSegments}
                  oldText={selectedVersion.snapshot.transcriptionText}
                  newText={currentTranscriptionText}
                />

                <Separator />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleRestore(selectedVersion.versionNumber)}
                  disabled={isRestoring}
                >
                  <Icon name="restore" size="xs" />
                  <span className="ml-1">Restaurar esta versao</span>
                </Button>
              </div>
            ) : (
              /* Version list */
              <div className="space-y-3">
                {versions.map((version) => (
                  <Card key={version.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          Versao #{version.versionNumber}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(version.editedAt)}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {version.changesSummary}
                      </p>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFetchSnapshot(version.versionNumber)}
                          disabled={isLoadingDetail}
                        >
                          <Icon name="difference" size="xs" />
                          <span className="ml-1">Ver diff</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(version.versionNumber)}
                          disabled={isRestoring}
                        >
                          <Icon name="restore" size="xs" />
                          <span className="ml-1">Restaurar</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Separator />

                {/* Original version marker */}
                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                        Original
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Transcricao original da IA — {formatDate(createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Restore confirmation dialog */}
      <Dialog open={confirmRestore !== null} onOpenChange={() => setConfirmRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar versao?</DialogTitle>
            <DialogDescription>
              A versao atual sera salva no historico antes de restaurar. Nenhum dado sera perdido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmRestore(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmRestoreVersion} disabled={isRestoring}>
              {isRestoring ? 'Restaurando...' : 'Restaurar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
