'use client'

/**
 * TransactionFilters — filter bar for the transaction list.
 *
 * Controls:
 *   - Type filter: All | BUY | SELL | INCOME | EXPENSE (segmented button)
 *   - Ticker filter: free-text input that filters by symbol (client-side)
 *
 * State is lifted to the parent via onChange callbacks so that the list
 * can be re-fetched or re-filtered without extra prop drilling.
 *
 * Usage:
 *   <TransactionFilters
 *     type={activeType}
 *     ticker={tickerFilter}
 *     onTypeChange={setActiveType}
 *     onTickerChange={setTickerFilter}
 *   />
 */

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TransactionType } from '@/lib/types'

type FilterType = TransactionType | 'ALL'

const TYPE_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Buy', value: 'BUY' },
  { label: 'Sell', value: 'SELL' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
]

interface TransactionFiltersProps {
  type: FilterType
  ticker: string
  onTypeChange: (type: FilterType) => void
  onTickerChange: (ticker: string) => void
}

export function TransactionFilters({
  type,
  ticker,
  onTypeChange,
  onTickerChange,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Type segmented control */}
      <div
        role="group"
        aria-label="Filter by transaction type"
        className="flex flex-wrap gap-1"
      >
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onTypeChange(opt.value)}
            aria-pressed={type === opt.value}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              type === opt.value
                ? 'bg-brand text-white'
                : 'bg-surface text-text-secondary hover:bg-surface-raised hover:text-text-primary'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Ticker text filter */}
      <div className="relative max-w-xs flex-1 sm:flex-none">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          <Search size={13} aria-hidden="true" />
        </span>
        <input
          type="text"
          value={ticker}
          onChange={(e) => onTickerChange(e.target.value.toUpperCase())}
          placeholder="Filter by ticker…"
          aria-label="Filter by ticker symbol"
          className={cn(
            'w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-sm',
            'text-text-primary placeholder:text-text-muted outline-none transition-colors',
            'focus:border-brand focus:ring-2 focus:ring-brand/20'
          )}
        />
      </div>
    </div>
  )
}

export type { FilterType }
