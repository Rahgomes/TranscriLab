'use client'

import type { AudioEvent } from '@/features/history/types/events'
import { getEventColor, getEventLabel } from '@/features/history/constants/events'
import { formatTimestamp } from '@/lib/segments'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface EventMarkersProps {
  events: AudioEvent[]
  duration: number
  onEventClick?: (startTime: number) => void
}

export function EventMarkers({ events, duration, onEventClick }: EventMarkersProps) {
  if (!events.length || !duration) return null

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative w-full h-full pointer-events-none">
        {events.map((event, index) => {
          const leftPercent = (event.startTime / duration) * 100
          const color = getEventColor(event.type)
          const label = getEventLabel(event.type)

          return (
            <Tooltip key={`${event.type}-${event.startTime}-${index}`}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="absolute top-0 h-full w-1 rounded-full pointer-events-auto cursor-pointer transition-opacity hover:opacity-100"
                  style={{
                    left: `${leftPercent}%`,
                    backgroundColor: color,
                    opacity: event.confidence >= 0.8 ? 0.85 : 0.5,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick?.(event.startTime)
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <span style={{ color }}>{label}</span>
                <span className="text-muted-foreground ml-1.5">
                  {formatTimestamp(event.startTime)}
                </span>
                {event.description && (
                  <span className="text-muted-foreground ml-1.5">
                    — {event.description}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
