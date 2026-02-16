'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { MovingBorderButton } from '@/components/ui/moving-border'
import { useRecordingStore } from '@/store'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface RecordButtonProps {
  variant?: 'sidebar' | 'sidebar-collapsed' | 'mobile-nav' | 'home'
  className?: string
}

export function RecordButton({ variant = 'home', className }: RecordButtonProps) {
  const openModal = useRecordingStore((s) => s.openRecordingModal)

  if (variant === 'home') {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <p className="text-sm text-muted-foreground">
          ou grave diretamente do microfone
        </p>
        <MovingBorderButton
          onClick={openModal}
          containerClassName="h-12"
          className="font-medium"
          borderRadius="0.75rem"
        >
          <Icon name="mic" size="md" className="mr-2" />
          Gravar Agora
        </MovingBorderButton>
      </div>
    )
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={openModal}
        className={cn(
          'relative flex items-center rounded-xl transition-all duration-200 group/sidebar',
          'hover:bg-accent h-11 px-3 gap-3',
          className,
        )}
      >
        <Icon
          name="mic"
          size="lg"
          weight={400}
          className="text-muted-foreground transition-colors flex-shrink-0 group-hover/sidebar:text-primary"
        />
        <motion.span
          animate={{ display: 'inline-block', opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-medium whitespace-pre text-muted-foreground group-hover/sidebar:translate-x-1 group-hover/sidebar:text-primary transition duration-150"
        >
          Gravar Agora
        </motion.span>
      </button>
    )
  }

  if (variant === 'sidebar-collapsed') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={openModal}
            className={cn(
              'relative flex items-center rounded-xl transition-all duration-200',
              'hover:bg-accent h-11 w-11 justify-center',
              className,
            )}
          >
            <Icon
              name="mic"
              size="lg"
              weight={400}
              className="text-muted-foreground transition-colors"
            />
            <span className="sr-only">Gravar Agora</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Gravar Agora</TooltipContent>
      </Tooltip>
    )
  }

  if (variant === 'mobile-nav') {
    return (
      <button
        onClick={openModal}
        className={cn(
          'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
          'hover:bg-accent',
          className,
        )}
      >
        <Icon
          name="mic"
          size="md"
          weight={400}
          className="text-muted-foreground transition-colors"
        />
        <span className="flex-1 font-medium">Gravar Agora</span>
      </button>
    )
  }

  // Fallback: simple button
  return (
    <Button
      variant="outline"
      onClick={openModal}
      className={cn('rounded-xl gap-2', className)}
    >
      <Icon name="mic" size="md" />
      Gravar Agora
    </Button>
  )
}
