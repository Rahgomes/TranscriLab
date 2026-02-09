import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
        outline: 'text-foreground border-border',
        success: 'border-transparent bg-success/10 text-success',
        // Category color variants
        blue: 'border-transparent bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        purple: 'border-transparent bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        orange: 'border-transparent bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        green: 'border-transparent bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        amber: 'border-transparent bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        pink: 'border-transparent bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
        cyan: 'border-transparent bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
