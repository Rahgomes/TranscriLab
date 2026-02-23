import { saveAs } from 'file-saver'
import type { ExportData, ExportOptions } from '../types'
import { exportToPdf } from './exportPdf'
import { exportToDocx } from './exportDocx'

/**
 * Exporta a transcrição para o formato escolhido
 */
export async function exportTranscription(
  data: ExportData,
  options: ExportOptions
): Promise<void> {
  const filename = sanitizeFilename(data.title)

  if (options.format === 'pdf') {
    const blob = await exportToPdf(data, options)
    saveAs(blob, `${filename}.pdf`)
  } else {
    const blob = await exportToDocx(data, options)
    saveAs(blob, `${filename}.docx`)
  }
}

/**
 * Remove caracteres inválidos do nome do arquivo
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100)
}

/**
 * Prepara os dados para exportação a partir do item do histórico
 */
export function prepareExportData(
  item: {
    fileName: string
    createdAt: Date | string
    transcription: string
    summary?: {
      summary: string
      insights: string[]
    } | null
    hasDiarization?: boolean
    speakerCount?: number | null
  },
  segments?: {
    speaker: string
    speakerLabel?: string | null
    text: string
    startTime: number
    endTime: number
  }[]
): ExportData {
  const transcription = item.transcription
  const wordCount = transcription.split(/\s+/).length
  const charCount = transcription.length

  // Calcula duração total se houver segmentos
  let duration: number | undefined
  if (segments && segments.length > 0) {
    const lastSegment = segments[segments.length - 1]
    duration = lastSegment.endTime
  }

  return {
    title: item.fileName,
    createdAt: new Date(item.createdAt),
    transcription,
    segments: segments?.map((s) => ({
      speaker: s.speaker,
      speakerLabel: s.speakerLabel ?? undefined,
      text: s.text,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
    summary: item.summary
      ? {
          summary: item.summary.summary,
          insights: item.summary.insights,
        }
      : undefined,
    metadata: {
      wordCount,
      charCount,
      duration,
      speakerCount: item.speakerCount ?? undefined,
    },
  }
}
