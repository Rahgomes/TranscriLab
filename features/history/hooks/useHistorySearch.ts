'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { HistoryItem, HistoryFilters, SortBy, SortOrder } from '../types'

interface UseHistorySearchProps {
  items: HistoryItem[]
}

interface UseHistorySearchReturn {
  filteredItems: HistoryItem[]
  filters: HistoryFilters
  setSearch: (search: string) => void
  setCategory: (category: string | undefined) => void
  setSortBy: (sortBy: SortBy) => void
  setSortOrder: (sortOrder: SortOrder) => void
  setDateRange: (range: { start: string; end: string } | undefined) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: HistoryFilters = {
  search: '',
  category: undefined,
  sortBy: 'date',
  sortOrder: 'desc',
  dateRange: undefined,
}

export function useHistorySearch({ items }: UseHistorySearchProps): UseHistorySearchReturn {
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.search])

  const filteredItems = useMemo(() => {
    let result = [...items]

    // Filter by search term
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      result = result.filter((item) => {
        const matchesFileName = item.fileName.toLowerCase().includes(searchLower)
        const matchesTranscription = item.transcription.toLowerCase().includes(searchLower)
        const matchesSummary = item.summary?.summary?.toLowerCase().includes(searchLower)
        return matchesFileName || matchesTranscription || matchesSummary
      })
    }

    // Filter by category
    if (filters.category) {
      result = result.filter((item) => item.category === filters.category)
    }

    // Filter by date range
    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start)
      const endDate = new Date(filters.dateRange.end)
      result = result.filter((item) => {
        const itemDate = new Date(item.createdAt)
        return itemDate >= startDate && itemDate <= endDate
      })
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
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

      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [items, debouncedSearch, filters.category, filters.dateRange, filters.sortBy, filters.sortOrder])

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }))
  }, [])

  const setCategory = useCallback((category: string | undefined) => {
    setFilters((prev) => ({ ...prev, category }))
  }, [])

  const setSortBy = useCallback((sortBy: SortBy) => {
    setFilters((prev) => ({ ...prev, sortBy }))
  }, [])

  const setSortOrder = useCallback((sortOrder: SortOrder) => {
    setFilters((prev) => ({ ...prev, sortOrder }))
  }, [])

  const setDateRange = useCallback((dateRange: { start: string; end: string } | undefined) => {
    setFilters((prev) => ({ ...prev, dateRange }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  return {
    filteredItems,
    filters,
    setSearch,
    setCategory,
    setSortBy,
    setSortOrder,
    setDateRange,
    resetFilters,
  }
}
