'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { HistoryItem, HistoryCategory, SortBy, SortOrder } from '@/features/history/types'
import type { SummaryData } from '@/features/summary/types'
import { DEFAULT_CATEGORIES } from '@/features/history/constants'
import { deleteAudio, clearAllAudios } from '@/lib/audioStorage'

interface HistoryState {
  // State
  items: HistoryItem[]
  categories: HistoryCategory[]
  isLoading: boolean
  isInitialized: boolean
  dbAvailable: boolean
  error: string | null

  // Filters
  search: string
  categoryFilter: string | undefined
  sortBy: SortBy
  sortOrder: SortOrder

  // Initialization
  initialize: () => Promise<void>

  // Item actions (async - localStorage always, API when available)
  addItem: (item: Omit<HistoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<HistoryItem>
  updateItem: (id: string, data: Partial<HistoryItem>) => Promise<void>
  updateItemSummary: (id: string, summary: SummaryData) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  renameFile: (id: string, newName: string) => Promise<void>
  updateItemCategory: (id: string, categoryId: string | undefined) => Promise<void>
  clearHistory: () => Promise<void>

  // Category actions (async - localStorage always, API when available)
  addCategory: (name: string, color: string) => Promise<HistoryCategory>
  updateCategory: (id: string, name: string, color: string) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  // Filter actions (sync - client-side only)
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
        categories: [],
        isLoading: false,
        isInitialized: false,
        dbAvailable: false,
        error: null,

        // Filters
        search: '',
        categoryFilter: undefined,
        sortBy: 'date' as SortBy,
        sortOrder: 'desc' as SortOrder,

        // Initialization - use API when database is configured, otherwise localStorage only
        initialize: async () => {
          if (get().isInitialized) return

          set((state) => {
            state.isLoading = true
            state.error = null
          })

          // Modo offline — sem DATABASE_URL, usar localStorage direto (persist ja carregou)
          if (!process.env.NEXT_PUBLIC_DATABASE_ENABLED) {
            set((state) => {
              if (state.categories.length === 0) {
                state.categories = DEFAULT_CATEGORIES
              }
              state.dbAvailable = false
              state.isInitialized = true
              state.isLoading = false
            })
            return
          }

          // Modo online — buscar dados do banco via API
          try {
            const [transcriptionsRes, categoriesRes] = await Promise.all([
              fetch('/api/transcriptions?limit=100&sortBy=date&sortOrder=desc'),
              fetch('/api/categories'),
            ])

            if (!transcriptionsRes.ok || !categoriesRes.ok) {
              throw new Error('API retornou erro')
            }

            const transcriptionsData = await transcriptionsRes.json()
            const categoriesData = await categoriesRes.json()

            set((state) => {
              state.items = transcriptionsData.items
              state.categories = categoriesData.categories.map((c: HistoryCategory & { isDefault?: boolean; _count?: unknown }) => ({
                id: c.id,
                name: c.name,
                color: c.color,
              }))
              state.dbAvailable = true
              state.isInitialized = true
              state.isLoading = false
            })
          } catch {
            // API/DB indisponivel em ambiente com DB configurado — fallback para localStorage
            console.warn('[TranscriLab] Banco de dados indisponivel. Usando localStorage como fallback.')

            set((state) => {
              if (state.categories.length === 0) {
                state.categories = DEFAULT_CATEGORIES
              }
              state.dbAvailable = false
              state.isInitialized = true
              state.isLoading = false
              state.error = null
            })
          }
        },

        // Item actions — localStorage always (via persist), API when available
        addItem: async (itemData) => {
          const now = new Date().toISOString()
          const newItem: HistoryItem = {
            id: crypto.randomUUID(),
            ...itemData,
            createdAt: now,
            updatedAt: now,
          }

          // Always add to store (persist saves to localStorage)
          set((state) => {
            state.items.unshift(newItem)
          })

          // Try API if DB available
          if (get().dbAvailable) {
            try {
              const response = await fetch('/api/transcriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileName: itemData.fileName,
                  originalFileName: itemData.originalFileName,
                  fileSize: itemData.fileSize,
                  duration: itemData.duration,
                  transcription: itemData.transcription,
                  hasAudio: itemData.hasAudio,
                  audioMimeType: itemData.audioMimeType,
                  categoryId: itemData.category || null,
                }),
              })

              if (response.ok) {
                const serverItem: HistoryItem = await response.json()
                set((state) => {
                  const index = state.items.findIndex((item) => item.id === newItem.id)
                  if (index !== -1) {
                    state.items[index] = serverItem
                  }
                })
                return serverItem
              }
            } catch (err) {
              console.warn('[TranscriLab] Falha ao sincronizar com API:', err)
            }
          }

          return newItem
        },

        updateItem: async (id, data) => {
          // Always update store (persist saves)
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

          // Try API if DB available
          if (get().dbAvailable) {
            try {
              const body: Record<string, unknown> = {}
              if (data.fileName !== undefined) body.fileName = data.fileName
              if (data.category !== undefined) body.categoryId = data.category || null

              await fetch(`/api/transcriptions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              })
            } catch (err) {
              console.warn('[TranscriLab] Falha ao sincronizar update com API:', err)
            }
          }
        },

        updateItemSummary: async (id, summary) => {
          set((state) => {
            const index = state.items.findIndex((item) => item.id === id)
            if (index !== -1) {
              state.items[index].summary = summary
              state.items[index].updatedAt = new Date().toISOString()
            }
          })
        },

        deleteItem: async (id) => {
          // Always remove from store (persist saves)
          set((state) => {
            state.items = state.items.filter((item) => item.id !== id)
          })

          // Delete audio from IndexedDB
          deleteAudio(id).catch(console.error)

          // Try API if DB available
          if (get().dbAvailable) {
            try {
              await fetch(`/api/transcriptions/${id}`, { method: 'DELETE' })
            } catch (err) {
              console.warn('[TranscriLab] Falha ao sincronizar delete com API:', err)
            }
          }
        },

        renameFile: async (id, newName) => {
          await get().updateItem(id, { fileName: newName })
        },

        updateItemCategory: async (id, categoryId) => {
          await get().updateItem(id, { category: categoryId })
        },

        clearHistory: async () => {
          const previousItems = get().items

          // Always clear store (persist saves)
          set((state) => {
            state.items = []
          })

          // Clear IndexedDB
          clearAllAudios().catch(console.error)

          // Try API if DB available
          if (get().dbAvailable) {
            try {
              await Promise.all(
                previousItems.map((item) =>
                  fetch(`/api/transcriptions/${item.id}`, { method: 'DELETE' })
                )
              )
            } catch (err) {
              console.warn('[TranscriLab] Falha ao sincronizar clear com API:', err)
            }
          }
        },

        // Category actions — localStorage always (via persist), API when available
        addCategory: async (name, color) => {
          const newCategory: HistoryCategory = {
            id: crypto.randomUUID(),
            name,
            color,
          }

          // Always add to store (persist saves)
          set((state) => {
            state.categories.push(newCategory)
          })

          // Try API if DB available
          if (get().dbAvailable) {
            try {
              const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color }),
              })

              if (response.ok) {
                const serverCategory: HistoryCategory = await response.json()
                set((state) => {
                  const index = state.categories.findIndex((cat) => cat.id === newCategory.id)
                  if (index !== -1) {
                    state.categories[index] = serverCategory
                  }
                })
                return serverCategory
              }
            } catch (err) {
              console.warn('[TranscriLab] Falha ao sincronizar categoria com API:', err)
            }
          }

          return newCategory
        },

        updateCategory: async (id, name, color) => {
          // Always update store (persist saves)
          set((state) => {
            const index = state.categories.findIndex((cat) => cat.id === id)
            if (index !== -1) {
              state.categories[index] = { ...state.categories[index], name, color }
            }
          })

          // Try API if DB available
          if (get().dbAvailable) {
            try {
              await fetch(`/api/categories/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color }),
              })
            } catch (err) {
              console.warn('[TranscriLab] Falha ao sincronizar update categoria com API:', err)
            }
          }
        },

        deleteCategory: async (id) => {
          // Always update store (persist saves)
          set((state) => {
            state.categories = state.categories.filter((cat) => cat.id !== id)
            state.items.forEach((item) => {
              if (item.category === id) {
                item.category = undefined
              }
            })
          })

          // Try API if DB available
          if (get().dbAvailable) {
            try {
              await fetch(`/api/categories/${id}`, { method: 'DELETE' })
            } catch (err) {
              console.warn('[TranscriLab] Falha ao sincronizar delete categoria com API:', err)
            }
          }
        },

        // Filter actions (sync - client-side only)
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
        name: 'audio-transcription-history',
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
export const useHistoryInitialized = () => useHistoryStore((state) => state.isInitialized)
export const useDbAvailable = () => useHistoryStore((state) => state.dbAvailable)
