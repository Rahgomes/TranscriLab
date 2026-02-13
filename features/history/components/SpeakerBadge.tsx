'use client'

import { cn } from '@/lib/utils'

interface SpeakerBadgeProps {
  displayName: string
  color: string
  className?: string
  size?: 'sm' | 'md'
}

export function SpeakerBadge({ displayName, color, className, size = 'sm' }: SpeakerBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-2.5 py-1',
        className,
      )}
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span
        className={cn(
          'rounded-full flex-shrink-0',
          size === 'sm' && 'w-1.5 h-1.5',
          size === 'md' && 'w-2 h-2',
        )}
        style={{ backgroundColor: color }}
      />
      {displayName}
    </span>
  )
}
