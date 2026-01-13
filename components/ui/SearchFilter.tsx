'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/format'

interface FilterOption {
  value: string
  label: string
}

interface SearchFilterProps {
  placeholder?: string
  onSearch: (query: string) => void
  filters?: {
    name: string
    label: string
    options: FilterOption[]
    value: string
    onChange: (value: string) => void
  }[]
  onClear?: () => void
  className?: string
}

export function SearchFilter({
  placeholder = 'Buscar...',
  onSearch,
  filters = [],
  onClear,
  className,
}: SearchFilterProps) {
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleClear = () => {
    setQuery('')
    filters.forEach(filter => filter.onChange(''))
    onClear?.()
  }

  const hasActiveFilters = query || filters.some(f => f.value)

  return (
    <div className={cn('card-leather p-4', className)}>
      <form onSubmit={handleSearch} className="space-y-4">
        <div className={cn(
          'grid gap-4',
          filters.length > 0 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'
        )}>
          {/* Campo de busca */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2 pl-10 bg-background/50 border border-border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                placeholder:text-muted-foreground"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filtros */}
          {filters.map((filter) => (
            <div key={filter.name}>
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full px-4 py-2 bg-background/50 border border-border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                  text-foreground"
              >
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Botoes */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-primary px-6 py-2"
          >
            Buscar
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-muted-foreground hover:text-foreground
                border border-border rounded-lg hover:bg-background/50 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
