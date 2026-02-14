import type { TranscriptionSegment } from '@/features/transcription/types'
import type { AudioEvent, AudioEventType } from '@/features/history/types/events'

export const SILENCE_THRESHOLD_SECONDS = 3.0

export const AUDIO_EVENT_PATTERNS: Record<Exclude<AudioEventType, 'SILENCE' | 'CROSSTALK' | 'OTHER'>, RegExp[]> = {
  LAUGHTER: [
    /\[risos?\]/gi,
    /\[risadas?\]/gi,
    /\[rindo\]/gi,
    /\[gargalhad(a|as)\]/gi,
    /\[laughter\]/gi,
    /\[laughing\]/gi,
    /\[chuckl(e|es|ing)\]/gi,
    /\(risos?\)/gi,
    /\(risadas?\)/gi,
  ],
  APPLAUSE: [
    /\[aplausos?\]/gi,
    /\[palmas\]/gi,
    /\[applause\]/gi,
    /\[clapping\]/gi,
    /\(aplausos?\)/gi,
    /\(palmas\)/gi,
  ],
  MUSIC: [
    /\[m[uú]sica\]/gi,
    /\[music\]/gi,
    /\[cantando\]/gi,
    /\[singing\]/gi,
    /\(m[uú]sica\)/gi,
  ],
}

/**
 * Detecta eventos de audio a partir de pattern matching no texto dos segmentos.
 * Busca anotacoes como [risos], [aplausos], [musica] etc.
 */
export function detectTextEvents(segments: TranscriptionSegment[]): AudioEvent[] {
  const events: AudioEvent[] = []

  for (const segment of segments) {
    const text = segment.text

    for (const [type, patterns] of Object.entries(AUDIO_EVENT_PATTERNS)) {
      for (const pattern of patterns) {
        // Reset lastIndex para regex com flag g
        pattern.lastIndex = 0
        const match = pattern.exec(text)
        if (match) {
          events.push({
            type: type as AudioEventType,
            startTime: segment.startTime,
            endTime: segment.endTime,
            confidence: 1.0,
            description: match[0],
            source: 'heuristic',
          })
          // Um evento por tipo por segmento e suficiente
          break
        }
      }
    }
  }

  return events
}

/**
 * Detecta silencios prolongados analisando gaps entre segmentos consecutivos.
 * Um gap >= threshold segundos e marcado como evento SILENCE.
 */
export function detectSilenceEvents(
  segments: TranscriptionSegment[],
  threshold: number = SILENCE_THRESHOLD_SECONDS
): AudioEvent[] {
  const events: AudioEvent[] = []

  for (let i = 0; i < segments.length - 1; i++) {
    const gap = segments[i + 1].startTime - segments[i].endTime
    if (gap >= threshold) {
      events.push({
        type: 'SILENCE',
        startTime: segments[i].endTime,
        endTime: segments[i + 1].startTime,
        confidence: 1.0,
        description: `Silencio de ${gap.toFixed(1)}s`,
        source: 'heuristic',
      })
    }
  }

  return events
}

/**
 * Executa todas as deteccoes heuristicas e retorna eventos ordenados por startTime.
 */
export function detectAllEvents(segments: TranscriptionSegment[]): AudioEvent[] {
  if (!segments || segments.length === 0) return []

  const textEvents = detectTextEvents(segments)
  const silenceEvents = detectSilenceEvents(segments)
  const allEvents = [...textEvents, ...silenceEvents]

  allEvents.sort((a, b) => a.startTime - b.startTime)

  return allEvents
}

/**
 * Binary search para encontrar o indice do evento ativo dado o currentTime.
 * Retorna -1 se nenhum evento esta ativo no momento.
 */
export function findActiveEventIndex(events: AudioEvent[], currentTime: number): number {
  if (events.length === 0) return -1

  let low = 0
  let high = events.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const event = events[mid]

    if (currentTime >= event.startTime && currentTime < event.endTime) {
      return mid
    } else if (currentTime < event.startTime) {
      high = mid - 1
    } else {
      low = mid + 1
    }
  }

  return -1
}
