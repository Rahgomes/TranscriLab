'use client'

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { HistoryItem, HistoryCategory, SortBy, SortOrder } from '@/features/history/types'
import type { SummaryData } from '@/features/summary/types'
import { DEFAULT_CATEGORIES, HISTORY_STORAGE_KEY, CATEGORIES_STORAGE_KEY } from '@/features/history/constants'
import { deleteAudio, clearAllAudios } from '@/lib/audioStorage'

interface HistoryState {
  // State
  items: HistoryItem[]
  categories: HistoryCategory[]
  isLoading: boolean

  // Filters
  search: string
  categoryFilter: string | undefined
  sortBy: SortBy
  sortOrder: SortOrder

  // Item actions
  addItem: (item: Omit<HistoryItem, 'id' | 'createdAt' | 'updatedAt'>) => HistoryItem
  updateItem: (id: string, data: Partial<HistoryItem>) => void
  updateItemSummary: (id: string, summary: SummaryData) => void
  deleteItem: (id: string) => void
  renameFile: (id: string, newName: string) => void
  updateItemCategory: (id: string, categoryId: string | undefined) => void
  clearHistory: () => void

  // Category actions
  addCategory: (name: string, color: string) => HistoryCategory
  updateCategory: (id: string, name: string, color: string) => void
  deleteCategory: (id: string) => void

  // Filter actions
  setSearch: (search: string) => void
  setCategoryFilter: (categoryId: string | undefined) => void
  setSortBy: (sortBy: SortBy) => void
  setSortOrder: (sortOrder: SortOrder) => void

  // Computed
  getCount: () => number
  getItemById: (id: string) => HistoryItem | undefined
  getFilteredItems: () => HistoryItem[]
}

export const useHistoryStore = create<HistoryState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        items: [],
        categories: DEFAULT_CATEGORIES,
        isLoading: false,

        // Filters
        search: '',
        categoryFilter: undefined,
        sortBy: 'date' as SortBy,
        sortOrder: 'desc' as SortOrder,

        // Item actions
        addItem: (itemData) => {
          const now = new Date().toISOString()
          const newItem: HistoryItem = {
            ...itemData,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          }
          set((state) => {
            state.items.unshift(newItem)
          })
          return newItem
        },

        updateItem: (id, data) => {
          set((state) => {
            const index = state.items.findIndex((item) => item.id === id)
            if (index !== -1) {
              state.items[index] = {
                ...state.items[index],
                ...data,
                updatedAt: new Date().toISOString(),
              }
            }
          })
        },

        updateItemSummary: (id, summary) => {
          set((state) => {
            const index = state.items.findIndex((item) => item.id === id)
            if (index !== -1) {
              state.items[index].summary = summary
              state.items[index].updatedAt = new Date().toISOString()
            }
          })
        },

        deleteItem: (id) => {
          // Deleta o áudio do IndexedDB (fire and forget)
          deleteAudio(id).catch(console.error)
          set((state) => {
            state.items = state.items.filter((item) => item.id !== id)
          })
        },

        renameFile: (id, newName) => {
          get().updateItem(id, { fileName: newName })
        },

        updateItemCategory: (id, categoryId) => {
          get().updateItem(id, { category: categoryId })
        },

        clearHistory: () => {
          // Limpa todos os áudios do IndexedDB (fire and forget)
          clearAllAudios().catch(console.error)
          set((state) => {
            state.items = []
          })
        },

        // Category actions
        addCategory: (name, color) => {
          const newCategory: HistoryCategory = {
            id: crypto.randomUUID(),
            name,
            color,
          }
          set((state) => {
            state.categories.push(newCategory)
          })
          return newCategory
        },

        updateCategory: (id, name, color) => {
          set((state) => {
            const index = state.categories.findIndex((cat) => cat.id === id)
            if (index !== -1) {
              state.categories[index] = { ...state.categories[index], name, color }
            }
          })
        },

        deleteCategory: (id) => {
          set((state) => {
            state.categories = state.categories.filter((cat) => cat.id !== id)
            // Remove category from items
            state.items.forEach((item) => {
              if (item.category === id) {
                item.category = undefined
              }
            })
          })
        },

        // Filter actions
        setSearch: (search) => {
          set((state) => {
            state.search = search
          })
        },

        setCategoryFilter: (categoryId) => {
          set((state) => {
            state.categoryFilter = categoryId
          })
        },

        setSortBy: (sortBy) => {
          set((state) => {
            state.sortBy = sortBy
          })
        },

        setSortOrder: (sortOrder) => {
          set((state) => {
            state.sortOrder = sortOrder
          })
        },

        // Computed
        getCount: () => get().items.length,

        getItemById: (id) => get().items.find((item) => item.id === id),

        getFilteredItems: () => {
          const { items, search, categoryFilter, sortBy, sortOrder } = get()
          let filtered = [...items]

          // Filter by search
          if (search) {
            const searchLower = search.toLowerCase()
            filtered = filtered.filter(
              (item) =>
                item.fileName.toLowerCase().includes(searchLower) ||
                item.transcription.toLowerCase().includes(searchLower) ||
                item.summary?.summary.toLowerCase().includes(searchLower)
            )
          }

          // Filter by category
          if (categoryFilter) {
            filtered = filtered.filter((item) => item.category === categoryFilter)
          }

          // Sort
          filtered.sort((a, b) => {
            let comparison = 0
            switch (sortBy) {
              case 'date':
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                break
              case 'name':
                comparison = a.fileName.localeCompare(b.fileName)
                break
              case 'size':
                comparison = a.fileSize - b.fileSize
                break
            }
            return sortOrder === 'asc' ? comparison : -comparison
          })

          return filtered
        },
      })),
      {
        name: HISTORY_STORAGE_KEY,
        partialize: (state) => ({
          items: state.items,
          categories: state.categories,
        }),
      }
    ),
    { name: 'HistoryStore' }
  )
)

// Selectors for better performance
export const useHistoryItems = () => useHistoryStore((state) => state.items)
export const useHistoryCategories = () => useHistoryStore((state) => state.categories)
export const useHistoryCount = () => useHistoryStore((state) => state.items.length)
export const useHistoryFilters = () =>
  useHistoryStore((state) => ({
    search: state.search,
    categoryFilter: state.categoryFilter,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
  }))
