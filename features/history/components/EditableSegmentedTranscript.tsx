'use client'

import { useRef, useEffect, useMemo, memo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SpeakerBadge } from './SpeakerBadge'
import type { SpeakerInfo } from '@/features/history/types/segments'
import type { EditableSegment } from '@/features/history/hooks/useEditorState'
import { groupConsecutiveSegments, formatTimestamp, buildSpeakerColorMap } from '@/lib/segments'

interface EditableSegmentedTranscriptProps {
  segments: EditableSegment[]
  speakers: SpeakerInfo[]
  activeSegmentIndex: number
  onSegmentClick: (startTime: number) => void
  onSegmentTextChange: (index: number, text: string) => void
  onSpeakerLabelChange: (index: number, label: string) => void
  onTimestampChange: (index: number, startTime: number, endTime: number) => void
}

function parseTimestamp(value: string): number | null {
  const parts = value.split(':')
  if (parts.length !== 2) return null
  const mins = parseInt(parts[0], 10)
  const secs = parseInt(parts[1], 10)
  if (isNaN(mins) || isNaN(secs)) return null
  if (secs < 0 || secs >= 60) return null
  return mins * 60 + secs
}

const EditableSegmentGroupItem = memo(function EditableSegmentGroupItem({
  speaker,
  displayName,
  speakerLabel,
  color,
  segments,
  startTime,
  endTime,
  isActive,
  hasModifiedSegments,
  onSegmentClick,
  onSegmentTextChange,
  onSpeakerLabelChange,
  onTimestampChange,
  groupRef,
}: {
  speaker: string
  displayName: string
  speakerLabel?: string
  color: string
  segments: EditableSegment[]
  startTime: number
  endTime: number
  isActive: boolean
  hasModifiedSegments: boolean
  onSegmentClick: () => void
  onSegmentTextChange: (index: number, text: string) => void
  onSpeakerLabelChange: (index: number, label: string) => void
  onTimestampChange: (index: number, startTime: number, endTime: number) => void
  groupRef?: React.RefObject<HTMLDivElement | null>
}) {
  const handleSpeakerLabelBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Apply to all segments in group
    for (const seg of segments) {
      onSpeakerLabelChange(seg.index, e.target.value)
    }
  }, [segments, onSpeakerLabelChange])

  return (
    <div
      ref={groupRef}
      className={cn(
        'group rounded-lg px-4 py-3 transition-all duration-200',
        'hover:bg-muted/50',
        isActive && 'bg-primary/5 border-l-2 border-primary',
        !isActive && 'border-l-2 border-transparent',
      )}
    >
      {/* Header: speaker badge + timestamp */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <SpeakerBadge
            displayName={speakerLabel || displayName}
            color={color}
            className="cursor-pointer"
          />
          {hasModifiedSegments && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Segmento editado
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <span
          className="text-xs text-muted-foreground tabular-nums cursor-pointer hover:text-primary transition-colors"
          onClick={onSegmentClick}
        >
          {formatTimestamp(startTime)}
        </span>

        {/* Inline speaker rename */}
        <Input
          defaultValue={speakerLabel || ''}
          placeholder={displayName}
          onBlur={handleSpeakerLabelBlur}
          className="h-6 w-28 text-xs px-1.5 py-0 border-dashed border-muted-foreground/30 bg-transparent focus:bg-background"
        />
      </div>

      {/* Editable text areas per segment */}
      <div className="space-y-2 pl-0.5">
        {segments.map((seg) => (
          <div key={seg.index} className="space-y-1">
            <Textarea
              value={seg.text}
              onChange={(e) => onSegmentTextChange(seg.index, e.target.value)}
              className={cn(
                'min-h-0 resize-none bg-muted/30 border-transparent focus:border-input text-base leading-relaxed',
                seg.isModified && 'border-amber-500/30',
              )}
              rows={Math.max(1, Math.ceil(seg.text.length / 80))}
            />

            {/* Timestamp inputs (compact) */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Input
                defaultValue={formatTimestamp(seg.startTime)}
                onBlur={(e) => {
                  const val = parseTimestamp(e.target.value)
                  if (val !== null) onTimestampChange(seg.index, val, seg.endTime)
                  else e.target.value = formatTimestamp(seg.startTime)
                }}
                className="h-5 w-14 text-xs tabular-nums px-1 py-0 border-dashed border-muted-foreground/20 bg-transparent text-center"
              />
              <span>-</span>
              <Input
                defaultValue={formatTimestamp(seg.endTime)}
                onBlur={(e) => {
                  const val = parseTimestamp(e.target.value)
                  if (val !== null && val > seg.startTime) onTimestampChange(seg.index, seg.startTime, val)
                  else e.target.value = formatTimestamp(seg.endTime)
                }}
                className="h-5 w-14 text-xs tabular-nums px-1 py-0 border-dashed border-muted-foreground/20 bg-transparent text-center"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

export function EditableSegmentedTranscript({
  segments,
  speakers,
  activeSegmentIndex,
  onSegmentClick,
  onSegmentTextChange,
  onSpeakerLabelChange,
  onTimestampChange,
}: EditableSegmentedTranscriptProps) {
  const activeGroupRef = useRef<HTMLDivElement>(null)
  const colorMap = useMemo(() => buildSpeakerColorMap(speakers), [speakers])
  const speakerNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of speakers) {
      map.set(s.id, s.displayName)
    }
    return map
  }, [speakers])

  // Group consecutive segments by speaker
  const groups = useMemo(() => groupConsecutiveSegments(segments), [segments])

  // Map groups to their editable segments for modification tracking
  const groupsWithEditableSegments = useMemo(() => {
    return groups.map((group) => ({
      ...group,
      editableSegments: group.segments as EditableSegment[],
      hasModifiedSegments: (group.segments as EditableSegment[]).some((s) => s.isModified),
    }))
  }, [groups])

  // Find which group contains the active segment
  const activeGroupIndex = useMemo(() => {
    if (activeSegmentIndex < 0) return -1
    let segCount = 0
    for (let i = 0; i < groups.length; i++) {
      segCount += groups[i].segments.length
      if (activeSegmentIndex < segCount) return i
    }
    return -1
  }, [groups, activeSegmentIndex])

  // No auto-scroll in edit mode (to avoid stealing textarea focus)
  // Just show visual indicator

  return (
    <div className="space-y-1">
      {groupsWithEditableSegments.map((group, i) => {
        const isActive = i === activeGroupIndex
        const firstSeg = group.editableSegments[0]
        return (
          <EditableSegmentGroupItem
            key={`${group.speaker}-${group.startTime}`}
            speaker={group.speaker}
            displayName={speakerNameMap.get(group.speaker) ?? `Speaker ${group.speaker}`}
            speakerLabel={firstSeg?.speakerLabel}
            color={colorMap.get(group.speaker) ?? '#6b7280'}
            segments={group.editableSegments}
            startTime={group.startTime}
            endTime={group.endTime}
            isActive={isActive}
            hasModifiedSegments={group.hasModifiedSegments}
            onSegmentClick={() => onSegmentClick(group.startTime)}
            onSegmentTextChange={onSegmentTextChange}
            onSpeakerLabelChange={onSpeakerLabelChange}
            onTimestampChange={onTimestampChange}
            groupRef={isActive ? activeGroupRef : undefined}
          />
        )
      })}
    </div>
  )
}
