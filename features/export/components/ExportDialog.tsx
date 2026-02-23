'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Icon } from '@/components/ui/icon'
import { toast } from 'sonner'
import type { ExportFormat, ExportOptions, ExportData } from '../types'
import { defaultExportOptions } from '../types'
import { exportTranscription } from '../lib/exportService'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ExportData
  hasDiarization: boolean
  hasSummary: boolean
}

export function ExportDialog({
  open,
  onOpenChange,
  data,
  hasDiarization,
  hasSummary,
}: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>(defaultExportOptions)
  const [isExporting, setIsExporting] = useState(false)

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportTranscription(data, options)
      toast.success(
        `Exportado como ${options.format.toUpperCase()}!`,
        { description: `${data.title}.${options.format}` }
      )
      onOpenChange(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Erro ao exportar', {
        description: 'Tente novamente ou escolha outro formato',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="download" size="md" className="text-primary" />
            Exportar Transcrição
          </DialogTitle>
          <DialogDescription>
            Escolha o formato e as opções de exportação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Formato */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(value) => updateOption('format', value as ExportFormat)}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="pdf" id="pdf" className="peer sr-only" />
                <Label
                  htmlFor="pdf"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Icon name="picture_as_pdf" size="lg" className="mb-2 text-red-500" />
                  <span className="font-medium">PDF</span>
                  <span className="text-xs text-muted-foreground">Visualização</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="docx" id="docx" className="peer sr-only" />
                <Label
                  htmlFor="docx"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Icon name="description" size="lg" className="mb-2 text-blue-500" />
                  <span className="font-medium">DOCX</span>
                  <span className="text-xs text-muted-foreground">Editável</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Opções de conteúdo */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Conteúdo</Label>
            <div className="space-y-3 rounded-lg border p-4">
              {/* Timestamps - só se tiver diarização */}
              {hasDiarization && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="timestamps" className="text-sm">
                      Timestamps
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Tempo de cada trecho
                    </p>
                  </div>
                  <Switch
                    id="timestamps"
                    checked={options.includeTimestamps}
                    onCheckedChange={(checked) => updateOption('includeTimestamps', checked)}
                  />
                </div>
              )}

              {/* Speaker labels - só se tiver diarização */}
              {hasDiarization && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="speakers" className="text-sm">
                      Identificação de falantes
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Nome de cada participante
                    </p>
                  </div>
                  <Switch
                    id="speakers"
                    checked={options.includeSpeakerLabels}
                    onCheckedChange={(checked) => updateOption('includeSpeakerLabels', checked)}
                  />
                </div>
              )}

              {/* Summary - só se tiver */}
              {hasSummary && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="summary" className="text-sm">
                      Resumo
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Resumo gerado por IA
                    </p>
                  </div>
                  <Switch
                    id="summary"
                    checked={options.includeSummary}
                    onCheckedChange={(checked) => updateOption('includeSummary', checked)}
                  />
                </div>
              )}

              {/* Insights - só se tiver summary */}
              {hasSummary && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="insights" className="text-sm">
                      Insights
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Pontos-chave identificados
                    </p>
                  </div>
                  <Switch
                    id="insights"
                    checked={options.includeInsights}
                    onCheckedChange={(checked) => updateOption('includeInsights', checked)}
                  />
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="metadata" className="text-sm">
                    Informações do arquivo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Data, palavras, duração
                  </p>
                </div>
                <Switch
                  id="metadata"
                  checked={options.includeMetadata}
                  onCheckedChange={(checked) => updateOption('includeMetadata', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <Icon name="progress_activity" size="sm" className="animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Icon name="download" size="sm" />
                Exportar {options.format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
