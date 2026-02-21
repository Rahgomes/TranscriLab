import type { ReactNode } from 'react'
import { GridBackground } from '@/components/ui/grid-background'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <GridBackground className="min-h-screen flex items-center justify-center p-4">
        {children}
      </GridBackground>
    </div>
  )
}
