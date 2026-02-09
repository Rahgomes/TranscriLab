import { cn } from '@/lib/utils'

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type IconWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700
type IconFill = 0 | 1

interface IconProps {
  name: string
  size?: IconSize
  weight?: IconWeight
  fill?: IconFill
  className?: string
}

const sizeMap: Record<IconSize, string> = {
  xs: 'text-base',    // 16px
  sm: 'text-lg',      // 18px
  md: 'text-xl',      // 20px
  lg: 'text-2xl',     // 24px
  xl: 'text-3xl',     // 30px
}

export function Icon({
  name,
  size = 'md',
  weight = 400,
  fill = 0,
  className,
}: IconProps) {
  return (
    <span
      className={cn(
        'material-symbols-outlined select-none',
        sizeMap[size],
        className
      )}
      style={{
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  )
}
