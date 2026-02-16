'use client'

import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { GridBackground } from '@/components/ui/grid-background'
import { RecordingOverlay } from '@/features/realtime'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      <main
        className="pt-14 md:pt-0 min-h-screen transition-all duration-300 md:pl-16"
      >
        <GridBackground className="min-h-screen">
          <div className="mx-auto w-[90%] py-6 md:py-8">
            {children}
          </div>
        </GridBackground>
      </main>
      <RecordingOverlay />
    </div>
  )
}
