'use client'

import { useEffect } from 'react'
import { useHistoryStore } from '@/store'

export function useInitializeData() {
  const initialize = useHistoryStore((state) => state.initialize)
  const isInitialized = useHistoryStore((state) => state.isInitialized)

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [initialize, isInitialized])
}
