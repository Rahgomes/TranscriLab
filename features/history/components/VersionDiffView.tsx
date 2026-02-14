'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { diffWords, type DiffToken } from '@/lib/diff'

interface DiffSegment {
  index: number
  speaker: string
  text: string
}

interface VersionDiffViewProps {
  oldSegments: DiffSegment[]
  newSegments: DiffSegment[]
  oldText?: string
  newText?: string
}

function DiffTokenSpan({ token }: { token: DiffToken }) {
  if (token.type === 'equal') {
    return <span>{token.text}</span>
  }

  if (token.type === 'remove') {
    return (
      <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 line-through">
        {token.text}
      </span>
    )
  }

  return (
    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
      {token.text}
    </span>
  )
}

function SegmentDiff({
  oldSeg,
  newSeg,
}: {
  oldSeg: DiffSegment | undefined
  newSeg: DiffSegment | undefined
}) {
  const tokens = useMemo(() => {
    if (!oldSeg && newSeg) {
      return [{ type: 'add' as const, text: newSeg.text }]
    }
    if (oldSeg && !newSeg) {
      return [{ type: 'remove' as const, text: oldSeg.text }]
    }
    if (oldSeg && newSeg) {
      return diffWords(oldSeg.text, newSeg.text)
    }
    return []
  }, [oldSeg, newSeg])

  const speakerChanged = oldSeg && newSeg && oldSeg.speaker !== newSeg.speaker

  if (tokens.length === 0) return null

  // Check if all tokens are 'equal'
  const hasChanges = tokens.some((t) => t.type !== 'equal') || speakerChanged

  if (!hasChanges) return null

  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums">#{(oldSeg ?? newSeg)?.index}</span>
        {speakerChanged && (
          <span>
            <span className="text-red-500 line-through">{oldSeg?.speaker}</span>
            {' → '}
            <span className="text-green-600">{newSeg?.speaker}</span>
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed">
        {tokens.map((token, i) => (
          <DiffTokenSpan key={i} token={token} />
        ))}
      </p>
    </div>
  )
}

export function VersionDiffView({
  oldSegments,
  newSegments,
  oldText,
  newText,
}: VersionDiffViewProps) {
  // If we have segments, diff segment-by-segment
  if (oldSegments.length > 0 || newSegments.length > 0) {
    const allIndices = new Set([
      ...oldSegments.map((s) => s.index),
      ...newSegments.map((s) => s.index),
    ])

    const sortedIndices = Array.from(allIndices).sort((a, b) => a - b)
    const oldMap = new Map(oldSegments.map((s) => [s.index, s]))
    const newMap = new Map(newSegments.map((s) => [s.index, s]))

    const diffs = sortedIndices
      .map((index) => ({
        index,
        old: oldMap.get(index),
        new: newMap.get(index),
      }))
      .filter(({ old: o, new: n }) => {
        if (!o || !n) return true
        return o.text !== n.text || o.speaker !== n.speaker
      })

    if (diffs.length === 0) {
      return (
        <div className="text-center text-sm text-muted-foreground py-4">
          Nenhuma diferenca encontrada entre as versoes.
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground mb-2">
          {diffs.length} {diffs.length === 1 ? 'segmento alterado' : 'segmentos alterados'}
        </div>
        {diffs.map(({ index, old: oldSeg, new: newSeg }) => (
          <SegmentDiff key={index} oldSeg={oldSeg} newSeg={newSeg} />
        ))}
      </div>
    )
  }

  // Fallback: diff plain text
  if (oldText && newText) {
    const tokens = diffWords(oldText, newText)
    const hasChanges = tokens.some((t) => t.type !== 'equal')

    if (!hasChanges) {
      return (
        <div className="text-center text-sm text-muted-foreground py-4">
          Nenhuma diferenca encontrada entre as versoes.
        </div>
      )
    }

    return (
      <div className="rounded-lg border border-border/50 p-3">
        <p className="text-sm leading-relaxed">
          {tokens.map((token, i) => (
            <DiffTokenSpan key={i} token={token} />
          ))}
        </p>
      </div>
    )
  }

  return (
    <div className="text-center text-sm text-muted-foreground py-4">
      Sem dados para comparar.
    </div>
  )
}
