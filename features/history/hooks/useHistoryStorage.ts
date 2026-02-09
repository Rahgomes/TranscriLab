'use client'

import { useState, useCallback, useEffect } from 'react'
import type { HistoryItem } from '../types'
import type { SummaryData } from '@/features/summary/types'
import { HISTORY_STORAGE_KEY } from '../constants'

interface UseHistoryStorageReturn {
  items: HistoryItem[]
  isLoading: boolean
  addItem: (item: Omit<HistoryItem, 'id' | 'createdAt' | 'updatedAt'>) => HistoryItem
  updateItem: (id: string, data: Partial<HistoryItem>) => void
  updateItemSummary: (id: string, summary: SummaryData) => void
  deleteItem: (id: string) => void
  renameFile: (id: string, newName: string) => void
  updateCategory: (id: string, category: string | undefined) => void
  clearHistory: () => void
  getCount: () => number
}

function getStoredItems(): HistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveItems(items: HistoryItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items))
}

export function useHistoryStorage(): UseHistoryStorageReturn {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setItems(getStoredItems())
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      saveItems(items)
    }
  }, [items, isLoading])

  const addItem = useCallback((data: Omit<HistoryItem, 'id' | 'createdAt' | 'updatedAt'>): HistoryItem => {
    const now = new Date().toISOString()
    const newItem: HistoryItem = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    setItems((prev) => [newItem, ...prev])
    return newItem
  }, [])

  const updateItem = useCallback((id: string, data: Partial<HistoryItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...data, updatedAt: new Date().toISOString() }
          : item
      )
    )
  }, [])

  const updateItemSummary = useCallback((id: string, summary: SummaryData) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, summary, updatedAt: new Date().toISOString() }
          : item
      )
    )
  }, [])

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const renameFile = useCallback((id: string, newName: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, fileName: newName, updatedAt: new Date().toISOString() }
          : item
      )
    )
  }, [])

  const updateCategory = useCallback((id: string, category: string | undefined) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, category, updatedAt: new Date().toISOString() }
          : item
      )
    )
  }, [])

  const clearHistory = useCallback(() => {
    setItems([])
  }, [])

  const getCount = useCallback(() => items.length, [items])

  return {
    items,
    isLoading,
    addItem,
    updateItem,
    updateItemSummary,
    deleteItem,
    renameFile,
    updateCategory,
    clearHistory,
    getCount,
  }
}
