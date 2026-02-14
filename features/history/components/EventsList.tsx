'use client'

import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { AudioEvent } from '@/features/history/types/events'
import { EventBadge } from './EventBadge'
import { getEventIcon } from '@/features/history/constants/events'
import { formatTimestamp } from '@/lib/segments'

interface EventsListProps {
  events: AudioEvent[]
  activeEventIndex?: number
  onEventClick?: (startTime: number) => void
}

export function EventsList({ events, activeEventIndex = -1, onEventClick }: EventsListProps) {
  if (!events.length) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon name="equalizer" size="sm" className="text-muted-foreground" />
          Eventos de Audio ({events.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-1">
            {events.map((event, index) => (
              <button
                key={`${event.type}-${event.startTime}-${index}`}
                type="button"
                onClick={() => onEventClick?.(event.startTime)}
                className={cn(
                  'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-left transition-colors',
                  'hover:bg-muted/50',
                  index === activeEventIndex && 'bg-primary/5 ring-1 ring-primary/20'
                )}
              >
                <Icon
                  name={getEventIcon(event.type)}
                  size="sm"
                  className="text-muted-foreground flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <EventBadge type={event.type} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(event.startTime)}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {event.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
