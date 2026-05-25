'use client'

/**
 * TickerAutocomplete — search input with live dropdown for ticker symbols.
 *
 * Behaviour:
 *   - Calls searchTickers() with 300ms debounce after the user types ≥ 1 char
 *   - Shows a loading spinner, results list, or a "no results" message
 *   - Selecting a result calls onSelect(ticker) and closes the dropdown
 *   - Clicking outside closes the dropdown
 *   - Controlled: value / onSelect props drive the selected state
 *
 * Usage:
 *   <TickerAutocomplete
 *     value={selectedSymbol}
 *     onSelect={(t) => setValue('ticker', t.symbol)}
 *     error={errors.ticker?.message}
 *   />
 */

import { useState, useEffect, useRef, useId } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { searchTickers } from '@/services/tickers.service'
import { cn } from '@/lib/utils'
import type { Ticker } from '@/lib/types'

interface TickerAutocompleteProps {
  /** Currently selected ticker symbol (controlled). */
  value?: string
  /** Called when a ticker is selected from the dropdown. */
  onSelect: (ticker: Ticker) => void
  /** Called when the selection is cleared. */
  onClear?: () => void
  /** Validation error message to display below the input. */
  error?: string
  /** Whether the field is disabled. */
  disabled?: boolean
  className?: string
  /** Label text for the search input (used for accessibility). */
  label?: string
}

export function TickerAutocomplete({
  value,
  onSelect,
  onClear,
  error,
  disabled,
  className,
  label = 'Search ticker',
}: TickerAutocompleteProps) {
  const inputId = useId()
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Ticker[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search — all setState calls happen inside the async setTimeout callback
  // to satisfy react-hooks/set-state-in-effect (no synchronous setState in effect body)
  useEffect(() => {
    const trimmed = query.trim()

    const timer = setTimeout(async () => {
      if (trimmed.length === 0) {
        setResults([])
        setIsOpen(false)
        return
      }
      setIsLoading(true)
      try {
        const data = await searchTickers(trimmed)
        setResults(data)
        setIsOpen(true)
        setActiveIndex(-1)
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, trimmed.length === 0 ? 0 : 300)

    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(ticker: Ticker) {
    onSelect(ticker)
    setQuery('')
    setIsOpen(false)
    setResults([])
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setIsOpen(false)
    onClear?.()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const hasValue = Boolean(value)

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Selected value chip */}
      {hasValue && (
        <div className="mb-1.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-subtle px-2.5 py-1 text-sm font-semibold text-brand">
            {value}
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                aria-label={`Remove ${value}`}
                className="ml-0.5 rounded hover:text-brand-hover"
              >
                <X size={12} aria-hidden="true" />
              </button>
            )}
          </span>
        </div>
      )}

      {/* Search input */}
      {!hasValue && (
        <div className="relative">
          <label htmlFor={inputId} className="sr-only">{label}</label>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Search size={14} aria-hidden="true" />
            )}
          </span>
          <input
            id={inputId}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Search symbol or company…"
            autoComplete="off"
            className={cn(
              'w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition-colors',
              'border-border bg-surface text-text-primary placeholder:text-text-muted',
              'focus:border-brand focus:ring-2 focus:ring-brand/20',
              error && 'border-loss focus:border-loss focus:ring-loss/20',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          />
        </div>
      )}

      {/* Error */}
      {error && <p className="mt-1 text-xs text-loss">{error}</p>}

      {/* Dropdown */}
      {isOpen && !hasValue && (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            'absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border',
            'bg-surface shadow-lg'
          )}
        >
          {results.length === 0 ? (
            <li role="option" aria-selected={false} className="px-3 py-2 text-sm text-text-muted">No results found.</li>
          ) : (
            results.map((ticker, i) => (
              <li
                key={ticker.symbol}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(ticker)
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm transition-colors',
                  i === activeIndex
                    ? 'bg-brand text-white'
                    : 'text-text-primary hover:bg-surface-raised'
                )}
              >
                <span className="font-semibold">{ticker.symbol}</span>
                <span
                  className={cn(
                    'truncate text-xs',
                    i === activeIndex ? 'text-white/80' : 'text-text-muted'
                  )}
                >
                  {ticker.name}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
