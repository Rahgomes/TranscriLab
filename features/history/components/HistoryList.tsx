'use client'

import { HistoryItemCard } from './HistoryItem'
import type { HistoryItem, HistoryCategory } from '../types'

interface HistoryListProps {
  items: HistoryItem[]
  categories: HistoryCategory[]
  onView: (item: HistoryItem) => void
  onRename: (id: string, newName: string) => void
  onUpdateCategory: (id: string, categoryId: string | undefined) => void
  onDelete: (id: string) => void
}

export function HistoryList({
  items,
  categories,
  onView,
  onRename,
  onUpdateCategory,
  onDelete,
}: HistoryListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <HistoryItemCard
          key={item.id}
          item={item}
          categories={categories}
          onView={onView}
          onRename={onRename}
          onUpdateCategory={onUpdateCategory}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
