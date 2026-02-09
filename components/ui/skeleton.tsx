import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean
}

function Skeleton({
  className,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-muted',
        shimmer ? 'skeleton' : 'animate-pulse-soft',
        className
      )}
      {...props}
    />
  )
}

function SkeletonText({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 space-y-4', className)}>
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

function SkeletonAvatar({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  }
  return <Skeleton className={cn('rounded-full', sizeClasses[size], className)} />
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar }
