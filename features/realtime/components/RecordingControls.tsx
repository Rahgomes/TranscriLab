'use client'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import type { RecordingPhase } from '../types'

interface RecordingControlsProps {
  phase: RecordingPhase
  onPause: () => void
  onResume: () => void
  onStop: () => void
  className?: string
}

export function RecordingControls({
  phase,
  onPause,
  onResume,
  onStop,
  className,
}: RecordingControlsProps) {
  const isRecording = phase === 'recording'
  const isPaused = phase === 'paused'

  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      {isRecording && (
        <Button
          variant="outline"
          size="lg"
          onClick={onPause}
          className="rounded-xl gap-2"
        >
          <Icon name="pause" size="md" />
          Pausar
        </Button>
      )}

      {isPaused && (
        <Button
          variant="outline"
          size="lg"
          onClick={onResume}
          className="rounded-xl gap-2"
        >
          <Icon name="play_arrow" size="md" />
          Continuar
        </Button>
      )}

      {(isRecording || isPaused) && (
        <Button
          variant="destructive"
          size="lg"
          onClick={onStop}
          className="rounded-xl gap-2"
        >
          <Icon name="stop" size="md" fill={1} />
          Parar
        </Button>
      )}
    </div>
  )
}
