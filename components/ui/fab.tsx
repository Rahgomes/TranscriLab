import { cn } from '@/lib/utils'
import { Icon } from './icon'

interface FABProps {
  icon?: string
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function FAB({ icon = 'bolt', onClick, className, disabled }: FABProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'fixed bottom-8 right-8 w-14 h-14',
        'bg-foreground text-background',
        'rounded-full shadow-2xl',
        'flex items-center justify-center',
        'hover:scale-110 active:scale-95',
        'transition-transform duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        'z-50',
        className
      )}
    >
      <Icon name={icon} size="lg" />
    </button>
  )
}
