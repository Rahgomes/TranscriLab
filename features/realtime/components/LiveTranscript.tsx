'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { RealtimeSegment } from '../types'

interface LiveTranscriptProps {
  segments: RealtimeSegment[]
  partialText: string
  className?: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function LiveTranscript({
  segments,
  partialText,
  className,
}: LiveTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new content appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [segments.length, partialText])

  const hasContent = segments.length > 0 || partialText

  return (
    <ScrollArea className={cn('w-full', className)}>
      <div className="space-y-3 p-4">
        {!hasContent && (
          <p className="text-center text-muted-foreground text-sm">
            Aguardando fala...
          </p>
        )}

        <AnimatePresence mode="popLayout">
          {segments
            .filter((s) => s.isFinal)
            .map((segment) => (
              <motion.div
                key={segment.index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex gap-3"
              >
                <span className="text-xs text-muted-foreground font-mono mt-1 shrink-0">
                  {formatTime(segment.startTime)}
                </span>
                <p className="text-sm leading-relaxed">{segment.text}</p>
              </motion.div>
            ))}
        </AnimatePresence>

        {partialText && (
          <div className="flex gap-3">
            <span className="text-xs text-muted-foreground font-mono mt-1 shrink-0 opacity-50">
              --:--
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {partialText}
              <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle animate-pulse" />
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
