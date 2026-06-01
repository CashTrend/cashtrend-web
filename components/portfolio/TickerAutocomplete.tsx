'use client'

/**
 * TickerAutocomplete — search input with live dropdown for ticker symbols.
 *
 * Behaviour:
 *   - Search only fires when the query reaches MIN_SEARCH_LENGTH (3) characters,
 *     avoiding costly single/double-character round-trips to Yahoo Finance.
 *   - 500ms debounce: the timer resets on every keystroke so the fetch only
 *     fires after the user pauses for half a second.
 *   - AbortController: each new search aborts the previous in-flight request,
 *     preventing stale results from overwriting fresh ones.
 *   - Selecting a result calls onSelect(ticker) and closes the dropdown.
 *   - Clicking outside closes the dropdown.
 *   - Controlled: value / onSelect props drive the selected state.
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
import { useLocale } from '@/context/locale-context'
import { interpolate } from '@/lib/i18n/types'
import { cn } from '@/lib/utils'
import { TICKER_SEARCH_MIN_LENGTH, TICKER_SEARCH_DEBOUNCE_MS } from '@/lib/constants'
import type { Ticker } from '@/lib/types'

/** Minimum query length before a search is dispatched to the backend. */
const MIN_SEARCH_LENGTH = TICKER_SEARCH_MIN_LENGTH

/** Milliseconds of inactivity after the last keystroke before the fetch fires. */
const SEARCH_DEBOUNCE_MS = TICKER_SEARCH_DEBOUNCE_MS

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
  /** Label text for the search input (used for accessibility). Defaults to translated value. */
  label?: string
}

export function TickerAutocomplete({
  value,
  onSelect,
  onClear,
  error,
  disabled,
  className,
  label,
}: TickerAutocompleteProps) {
  const { t } = useLocale()
  const inputId = useId()
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Ticker[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  // Holds the AbortController for the most recent in-flight search request.
  // Calling .abort() cancels the fetch so stale responses are discarded.
  const abortRef = useRef<AbortController | null>(null)

  // Abort any in-flight request when the component unmounts (e.g. the user
  // navigates away or the form is closed mid-search).  Prevents the completed
  // fetch from calling setState on an unmounted component.
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const resolvedLabel = label ?? t.tickers.autocomplete_label

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

  // Debounced search with minimum length guard and AbortController
  useEffect(() => {
    const trimmed = query.trim()

    // Use a timer even for the early-return case so setState calls happen
    // inside a callback (avoids the react-hooks/set-state-in-effect lint rule).
    const delay = trimmed.length < MIN_SEARCH_LENGTH ? 0 : SEARCH_DEBOUNCE_MS

    const timer = setTimeout(async () => {
      // Below the minimum length: reset dropdown immediately without fetching.
      if (trimmed.length < MIN_SEARCH_LENGTH) {
        abortRef.current?.abort()
        setResults([])
        setIsOpen(false)
        setIsLoading(false)
        return
      }

      // Cancel any previous in-flight request before starting a new one.
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsLoading(true)

      try {
        const data = await searchTickers(trimmed, controller.signal)
        setResults(data)
        setIsOpen(true)
        setActiveIndex(-1)
      } catch (err) {
        // AbortError is expected when a newer search supersedes this one —
        // silently discard it so the dropdown doesn't flash or close unexpectedly.
        if (err instanceof DOMException && err.name === 'AbortError') return
        setResults([])
        // Keep isOpen false — the user sees an empty dropdown on error,
        // consistent with the previous behaviour.
      } finally {
        // Only clear loading if this controller wasn't already superseded.
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, delay)

    // Cleanup: cancel the pending timer if the query changes before it fires.
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
                aria-label={interpolate(t.tickers.autocomplete_remove, { symbol: value ?? '' })}
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
          <label htmlFor={inputId} className="sr-only">
            {resolvedLabel}
          </label>
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
            placeholder={t.tickers.autocomplete_placeholder}
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
            <li role="option" aria-selected={false} className="px-3 py-2 text-sm text-text-muted">
              {t.tickers.autocomplete_no_results}
            </li>
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

