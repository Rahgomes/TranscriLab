'use client'

import { useState, useCallback, useEffect } from 'react'
import type { HistoryCategory } from '../types'
import { CATEGORIES_STORAGE_KEY, DEFAULT_CATEGORIES } from '../constants'

interface UseCategoriesReturn {
  categories: HistoryCategory[]
  isLoading: boolean
  addCategory: (name: string, color: string) => HistoryCategory
  updateCategory: (id: string, name: string, color: string) => void
  deleteCategory: (id: string) => void
  getCategoryById: (id: string) => HistoryCategory | undefined
}

function getStoredCategories(): HistoryCategory[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES
  } catch {
    return DEFAULT_CATEGORIES
  }
}

function saveCategories(categories: HistoryCategory[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<HistoryCategory[]>(DEFAULT_CATEGORIES)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setCategories(getStoredCategories())
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      saveCategories(categories)
    }
  }, [categories, isLoading])

  const addCategory = useCallback((name: string, color: string): HistoryCategory => {
    const newCategory: HistoryCategory = {
      id: crypto.randomUUID(),
      name,
      color,
    }
    setCategories((prev) => [...prev, newCategory])
    return newCategory
  }, [])

  const updateCategory = useCallback((id: string, name: string, color: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, name, color } : cat
      )
    )
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id))
  }, [])

  const getCategoryById = useCallback((id: string): HistoryCategory | undefined => {
    return categories.find((cat) => cat.id === id)
  }, [categories])

  return {
    categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  }
}
