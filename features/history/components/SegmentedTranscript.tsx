'use client'

import { useRef, useEffect, useMemo, memo } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SpeakerBadge } from './SpeakerBadge'
import type { TranscriptionSegment } from '@/features/transcription/types'
import type { SpeakerInfo } from '@/features/history/types/segments'
import { groupConsecutiveSegments, formatTimestamp, buildSpeakerColorMap } from '@/lib/segments'

interface SegmentedTranscriptProps {
  segments: TranscriptionSegment[]
  speakers: SpeakerInfo[]
  activeSegmentIndex: number
  onSegmentClick: (startTime: number) => void
}

const SegmentGroupItem = memo(function SegmentGroupItem({
  speaker,
  displayName,
  color,
  text,
  startTime,
  endTime,
  isActive,
  onClick,
  groupRef,
}: {
  speaker: string
  displayName: string
  color: string
  text: string
  startTime: number
  endTime: number
  isActive: boolean
  onClick: () => void
  groupRef?: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={groupRef}
      onClick={onClick}
      className={cn(
        'group rounded-lg px-4 py-3 cursor-pointer transition-all duration-200',
        'hover:bg-muted/50',
        isActive && 'bg-primary/5 border-l-2 border-primary',
        !isActive && 'border-l-2 border-transparent',
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <SpeakerBadge displayName={displayName} color={color} />
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatTimestamp(startTime)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {formatTimestamp(startTime)} - {formatTimestamp(endTime)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-base leading-relaxed text-foreground/90 pl-0.5">
        {text}
      </p>
    </div>
  )
})

export function SegmentedTranscript({
  segments,
  speakers,
  activeSegmentIndex,
  onSegmentClick,
}: SegmentedTranscriptProps) {
  const activeGroupRef = useRef<HTMLDivElement>(null)
  const colorMap = useMemo(() => buildSpeakerColorMap(speakers), [speakers])
  const speakerNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of speakers) {
      map.set(s.id, s.displayName)
    }
    return map
  }, [speakers])

  const groups = useMemo(() => groupConsecutiveSegments(segments), [segments])

  // Encontra qual grupo contem o segmento ativo
  const activeGroupIndex = useMemo(() => {
    if (activeSegmentIndex < 0) return -1
    let segCount = 0
    for (let i = 0; i < groups.length; i++) {
      segCount += groups[i].segments.length
      if (activeSegmentIndex < segCount) return i
    }
    return -1
  }, [groups, activeSegmentIndex])

  // Auto-scroll para o grupo ativo
  useEffect(() => {
    if (activeGroupRef.current) {
      activeGroupRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [activeGroupIndex])

  return (
    <div className="space-y-1">
      {groups.map((group, i) => {
        const isActive = i === activeGroupIndex
        const groupText = group.segments.map((s) => s.text).join(' ')
        return (
          <SegmentGroupItem
            key={`${group.speaker}-${group.startTime}`}
            speaker={group.speaker}
            displayName={speakerNameMap.get(group.speaker) ?? `Speaker ${group.speaker}`}
            color={colorMap.get(group.speaker) ?? '#6b7280'}
            text={groupText}
            startTime={group.startTime}
            endTime={group.endTime}
            isActive={isActive}
            onClick={() => onSegmentClick(group.startTime)}
            groupRef={isActive ? activeGroupRef : undefined}
          />
        )
      })}
    </div>
  )
}
