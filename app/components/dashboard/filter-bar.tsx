"use client"

import { useState, useCallback, useMemo } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Filter definitions                                                 */
/* ------------------------------------------------------------------ */

export interface FilterState {
  search: string
  category: string
  format: string
  price: string
}

const categories = ["Все", "Базовый", "Продвинутый", "Мастер-класс"] as const
const formats = ["Все", "Видео-курс", "Вебинар", "Практикум"] as const
const prices = ["Все", "Бесплатные", "Платные"] as const

const defaultFilters: FilterState = {
  search: "",
  category: "Все",
  format: "Все",
  price: "Все",
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface FilterBarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

/* ------------------------------------------------------------------ */
/*  FilterPill -- individual clickable filter chip                     */
/* ------------------------------------------------------------------ */

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  FilterBar component                                                */
/* ------------------------------------------------------------------ */

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const updateFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      onFiltersChange({ ...filters, [key]: value })
    },
    [filters, onFiltersChange],
  )

  const hasActiveFilters = useMemo(
    () =>
      filters.search !== "" ||
      filters.category !== "Все" ||
      filters.format !== "Все" ||
      filters.price !== "Все",
    [filters],
  )

  const resetFilters = useCallback(() => {
    onFiltersChange(defaultFilters)
  }, [onFiltersChange])

  return (
    <div className="flex flex-col gap-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          placeholder="Поиск курсов..."
          className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => updateFilter("search", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter groups */}
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Категория
          </span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <FilterPill
                key={cat}
                label={cat}
                active={filters.category === cat}
                onClick={() => updateFilter("category", cat)}
              />
            ))}
          </div>
        </div>

        {/* Format */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Формат
          </span>
          <div className="flex flex-wrap gap-1.5">
            {formats.map((fmt) => (
              <FilterPill
                key={fmt}
                label={fmt}
                active={filters.format === fmt}
                onClick={() => updateFilter("format", fmt)}
              />
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Цена
          </span>
          <div className="flex flex-wrap gap-1.5">
            {prices.map((p) => (
              <FilterPill
                key={p}
                label={p}
                active={filters.price === p}
                onClick={() => updateFilter("price", p)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Reset link */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="self-start text-xs font-medium text-accent underline underline-offset-2 transition-colors hover:text-accent/80"
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  )
}

/* Export defaults for external usage */
export { defaultFilters }
