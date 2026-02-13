import type { TranscriptionSegment } from '@/features/transcription/types'
import type { SpeakerInfo, SegmentGroup } from '@/features/history/types/segments'
import { getSpeakerColor, getSpeakerDisplayName } from '@/features/history/constants/speakers'

/**
 * Agrupa segmentos consecutivos do mesmo speaker em SegmentGroup[].
 * Segmentos adjacentes do mesmo speaker sao agrupados em um unico bloco visual.
 */
export function groupConsecutiveSegments(segments: TranscriptionSegment[]): SegmentGroup[] {
  if (segments.length === 0) return []

  const groups: SegmentGroup[] = []
  let currentGroup: SegmentGroup = {
    speaker: segments[0].speaker,
    segments: [segments[0]],
    startTime: segments[0].startTime,
    endTime: segments[0].endTime,
  }

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i]
    if (segment.speaker === currentGroup.speaker) {
      currentGroup.segments.push(segment)
      currentGroup.endTime = segment.endTime
    } else {
      groups.push(currentGroup)
      currentGroup = {
        speaker: segment.speaker,
        segments: [segment],
        startTime: segment.startTime,
        endTime: segment.endTime,
      }
    }
  }

  groups.push(currentGroup)
  return groups
}

/**
 * Binary search para encontrar o indice do segmento ativo dado o currentTime.
 * Retorna -1 se nenhum segmento esta ativo no momento.
 */
export function findActiveSegmentIndex(segments: TranscriptionSegment[], currentTime: number): number {
  if (segments.length === 0) return -1

  let low = 0
  let high = segments.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const segment = segments[mid]

    if (currentTime >= segment.startTime && currentTime < segment.endTime) {
      return mid
    } else if (currentTime < segment.startTime) {
      high = mid - 1
    } else {
      low = mid + 1
    }
  }

  // Se nao encontrou match exato, retorna o segmento mais proximo anterior
  if (low > 0 && currentTime >= segments[low - 1].startTime) {
    return low - 1
  }

  return -1
}

/**
 * Extrai informacoes de cada speaker: tempo total de fala, contagem de segmentos, cor.
 */
export function extractSpeakerInfo(segments: TranscriptionSegment[]): SpeakerInfo[] {
  const speakerMap = new Map<string, { totalDuration: number; segmentCount: number }>()

  for (const segment of segments) {
    const existing = speakerMap.get(segment.speaker)
    const duration = segment.endTime - segment.startTime
    if (existing) {
      existing.totalDuration += duration
      existing.segmentCount += 1
    } else {
      speakerMap.set(segment.speaker, { totalDuration: duration, segmentCount: 1 })
    }
  }

  const speakers: SpeakerInfo[] = []
  let colorIndex = 0
  for (const [id, info] of speakerMap) {
    speakers.push({
      id,
      displayName: getSpeakerDisplayName(id),
      color: getSpeakerColor(colorIndex),
      totalDuration: info.totalDuration,
      segmentCount: info.segmentCount,
    })
    colorIndex++
  }

  return speakers
}

/**
 * Cria um mapa de speaker -> cor para lookup rapido nos componentes.
 */
export function buildSpeakerColorMap(speakers: SpeakerInfo[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const speaker of speakers) {
    map.set(speaker.id, speaker.color)
  }
  return map
}

/**
 * Formata segundos para mm:ss (ex: 125.5 -> "2:05")
 */
export function formatTimestamp(seconds: number): string {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
