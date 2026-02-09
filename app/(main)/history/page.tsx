'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Icon } from '@/components/ui/icon'
import { FAB } from '@/components/ui/fab'
import { useHistoryStore } from '@/store'
import {
  useHistorySearch,
  SearchBar,
  HistoryList,
  HistoryDetail,
  EmptyState,
  CategoryManager,
} from '@/features/history'
import type { HistoryItem } from '@/features/history'

export default function HistoryPage() {
  const items = useHistoryStore((state) => state.items)
  const categories = useHistoryStore((state) => state.categories)
  const renameFile = useHistoryStore((state) => state.renameFile)
  const updateCategory = useHistoryStore((state) => state.updateItemCategory)
  const deleteItem = useHistoryStore((state) => state.deleteItem)
  const updateItemSummary = useHistoryStore((state) => state.updateItemSummary)
  const addCategory = useHistoryStore((state) => state.addCategory)
  const updateCat = useHistoryStore((state) => state.updateCategory)
  const deleteCategory = useHistoryStore((state) => state.deleteCategory)
  const count = items.length
  const isLoading = false
  const {
    filteredItems,
    filters,
    setSearch,
    setCategory,
    setSortBy,
    setSortOrder,
  } = useHistorySearch({ items })

  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  function handleView(item: HistoryItem) {
    setSelectedItem(item)
    setDetailOpen(true)
  }

  async function handleGenerateSummary(item: HistoryItem) {
    setIsGeneratingSummary(true)
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.transcription }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar resumo')
      }

      updateItemSummary(item.id, {
        summary: data.summary,
        insights: data.insights,
        tokensUsed: data.tokensUsed,
        generatedAt: new Date(),
      })

      setSelectedItem((prev) =>
        prev?.id === item.id
          ? {
              ...prev,
              summary: {
                summary: data.summary,
                insights: data.insights,
                tokensUsed: data.tokensUsed,
                generatedAt: new Date(),
              },
            }
          : prev
      )

      toast.success('Resumo gerado com sucesso!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar resumo'
      toast.error(message)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const hasFilters = filters.search !== '' || filters.category !== undefined

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="w-full py-8 md:py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="space-y-3 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="w-full py-8 md:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
                <Icon name="history" size="lg" className="text-primary" />
                Historico
              </h1>
              <p className="text-muted-foreground mt-2">
                {count > 0
                  ? `${count} transcric${count === 1 ? 'ao' : 'oes'} salva${count === 1 ? '' : 's'}`
                  : 'Suas transcricoes aparecerao aqui'}
              </p>
            </div>

            {count > 0 && (
              <CategoryManager
                categories={categories}
                onAdd={addCategory}
                onUpdate={updateCat}
                onDelete={deleteCategory}
              />
            )}
          </div>
        </header>

        {/* Search and filters */}
        {count > 0 && (
          <div className="mb-6">
            <SearchBar
              search={filters.search}
              onSearchChange={setSearch}
              category={filters.category}
              onCategoryChange={setCategory}
              categories={categories}
              sortBy={filters.sortBy}
              onSortByChange={setSortBy}
              sortOrder={filters.sortOrder}
              onSortOrderChange={setSortOrder}
            />
          </div>
        )}

        {/* Content */}
        {count === 0 ? (
          <EmptyState />
        ) : filteredItems.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <HistoryList
            items={filteredItems}
            categories={categories}
            onView={handleView}
            onRename={renameFile}
            onUpdateCategory={updateCategory}
            onDelete={deleteItem}
          />
        )}

        {/* Detail dialog */}
        <HistoryDetail
          item={selectedItem}
          categories={categories}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onGenerateSummary={handleGenerateSummary}
          isGeneratingSummary={isGeneratingSummary}
        />
      </div>

      {/* FAB - New transcription */}
      <Link href="/">
        <FAB icon="add" className="bg-primary hover:bg-primary/90" />
      </Link>
    </div>
  )
}
