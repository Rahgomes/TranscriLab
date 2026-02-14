'use client'

import { cn } from '@/lib/utils'
import type { AudioEventType } from '@/features/history/types/events'
import { getEventColor, getEventLabel } from '@/features/history/constants/events'

interface EventBadgeProps {
  type: AudioEventType
  className?: string
  size?: 'sm' | 'md'
}

export function EventBadge({ type, className, size = 'sm' }: EventBadgeProps) {
  const color = getEventColor(type)
  const label = getEventLabel(type)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      <span
        className="flex-shrink-0 rounded-full"
        style={{
          backgroundColor: color,
          width: size === 'sm' ? 6 : 8,
          height: size === 'sm' ? 6 : 8,
        }}
      />
      {label}
    </span>
  )
}
