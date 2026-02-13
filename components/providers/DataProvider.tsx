'use client'

import type { ReactNode } from 'react'
import { useInitializeData } from '@/hooks/useInitializeData'

export function DataProvider({ children }: { children: ReactNode }) {
  useInitializeData()

  return <>{children}</>
}
