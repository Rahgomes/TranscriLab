'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { DerivedContentCard } from './DerivedContentCard'
import type { DerivedContentData } from '../types/derivedContent'

interface DerivedContentListProps {
  items: DerivedContentData[]
  isLoading: boolean
  onDelete: (id: string) => Promise<void>
}

export function DerivedContentList({ items, isLoading, onDelete }: DerivedContentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <DerivedContentCard key={item.id} item={item} onDelete={onDelete} />
      ))}
    </div>
  )
}
