'use client'

import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { HistoryCategory, SortBy, SortOrder } from '../types'

const searchPlaceholders = [
  'Buscar transcricoes...',
  'Pesquisar por nome...',
  'Encontrar audio...',
  'Buscar por conteudo...',
]

interface SearchBarProps {
  search: string
  onSearchChange: (value: string) => void
  category: string | undefined
  onCategoryChange: (value: string | undefined) => void
  categories: HistoryCategory[]
  sortBy: SortBy
  onSortByChange: (value: SortBy) => void
  sortOrder: SortOrder
  onSortOrderChange: (value: SortOrder) => void
}

export function SearchBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: SearchBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search Input with Vanish Effect */}
      <div className="flex-1">
        <PlaceholdersAndVanishInput
          placeholders={searchPlaceholders}
          onChange={(e) => onSearchChange(e.target.value)}
          onSubmit={(e) => {
            e.preventDefault()
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select
          value={category || 'all'}
          onValueChange={(value) => onCategoryChange(value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-[140px] h-11 rounded-xl">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => onSortByChange(value as SortBy)}>
          <SelectTrigger className="w-[120px] h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Data</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
            <SelectItem value="size">Tamanho</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl"
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
        >
          <Icon
            name="swap_vert"
            size="md"
            className={`transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>
    </div>
  )
}
