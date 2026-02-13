'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { SpeakerBadge } from './SpeakerBadge'
import type { SpeakerInfo } from '@/features/history/types/segments'
import { formatTimestamp } from '@/lib/segments'

interface SpeakersListProps {
  speakers: SpeakerInfo[]
}

export function SpeakersList({ speakers }: SpeakersListProps) {
  if (speakers.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon name="group" size="md" className="text-primary" />
          Participantes ({speakers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {speakers.map((speaker) => (
          <div key={speaker.id} className="flex items-center justify-between">
            <SpeakerBadge
              displayName={speaker.displayName}
              color={speaker.color}
              size="md"
            />
            <div className="text-right">
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(speaker.totalDuration)}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                ({speaker.segmentCount} seg.)
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
