'use client'

/**
 * Tickers search page — live search with debounce, result cards.
 *
 * Behaviour:
 *   - Search only fires when the query reaches 3 characters (avoids costly
 *     single/double-character searches that hit Yahoo Finance).
 *   - 500ms debounce: the timer is reset on every keystroke so the fetch only
 *     fires after the user pauses for half a second.
 *   - AbortController: each new search aborts the previous in-flight HTTP
 *     request, preventing stale results from overwriting fresh ones and
 *     reducing unnecessary backend load.
 *   - Results shown as clickable cards → /tickers/[symbol]
 *   - Empty/error/no-results states are gated on `searched` to avoid flashing.
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, Loader2, TrendingUp } from 'lucide-react'
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

export default function TickersPage() {
  const { t } = useLocale()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Ticker[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchError, setSearchError] = useState(false)

  // Holds the AbortController for the most recent in-flight search request.
  // Calling .abort() on it cancels the fetch so the response is discarded.
  const abortRef = useRef<AbortController | null>(null)

  // Abort any in-flight request when the component unmounts (e.g. the user
  // navigates away mid-search).  Prevents the completed fetch from trying to
  // call setState on an unmounted component and wastes no backend resources.
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    const trimmed = query.trim()

    // Use a timer even for the early-return case so setState calls happen
    // inside a callback (avoids the react-hooks/set-state-in-effect lint rule).
    const delay = trimmed.length < MIN_SEARCH_LENGTH ? 0 : SEARCH_DEBOUNCE_MS

    const timer = setTimeout(async () => {
      // Below the minimum length: reset UI and don't fetch.
      if (trimmed.length < MIN_SEARCH_LENGTH) {
        abortRef.current?.abort()
        setResults([])
        setSearched(false)
        setSearchError(false)
        setLoading(false)
        return
      }

      // Cancel any previous in-flight request before starting a new one.
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setSearchError(false)

      try {
        const data = await searchTickers(trimmed, controller.signal)
        setResults(data)
        setSearched(true)
      } catch (err) {
        // AbortError is expected when a newer search supersedes this one —
        // silently discard it so we don't show a spurious error to the user.
        if (err instanceof DOMException && err.name === 'AbortError') return
        setResults([])
        setSearched(true)
        setSearchError(true)
      } finally {
        // Only clear loading if this controller wasn't already superseded.
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, delay)

    // Cleanup: cancel the pending timer if the query changes before it fires.
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="flex flex-col gap-6">
      {/* Search input */}
      <div className="relative max-w-lg">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          {loading ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Search size={16} aria-hidden="true" />
          )}
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.tickers.search_placeholder}
          aria-label={t.tickers.search_aria}
          autoFocus
          className={cn(
            'w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm',
            'text-text-primary placeholder:text-text-muted outline-none shadow-sm transition-colors',
            'focus:border-brand focus:ring-2 focus:ring-brand/20'
          )}
        />
      </div>

      {/* Results */}
      {!query.trim() && <p className="text-sm text-text-muted">{t.tickers.search_prompt}</p>}

      {/* Hint shown while the user hasn't reached the minimum length yet */}
      {query.trim().length > 0 && query.trim().length < MIN_SEARCH_LENGTH && (
        <p className="text-sm text-text-muted">{t.tickers.search_min_chars}</p>
      )}

      {searched && !loading && searchError && (
        <p className="text-sm text-loss">{t.tickers.search_error}</p>
      )}

      {searched && !loading && !searchError && results.length === 0 && (
        <p className="text-sm text-text-secondary">
          {interpolate(t.tickers.search_no_results, { query })}
        </p>
      )}

      {results.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" role="list">
          {results.map((ticker) => (
            <li key={ticker.symbol}>
              <Link
                href={`/tickers/${ticker.symbol}`}
                className={cn(
                  'flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm',
                  'transition-colors hover:border-brand/50 hover:bg-surface-raised'
                )}
              >
                {/* Icon */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                  <TrendingUp size={16} aria-hidden="true" />
                </span>

                {/* Info */}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-bold text-text-primary">
                    {ticker.symbol}
                  </span>
                  <span className="truncate text-xs text-text-secondary">{ticker.name}</span>
                  {ticker.sector && (
                    <span className="truncate text-xs text-text-muted">{ticker.sector}</span>
                  )}
                </div>

                {/* Market badge + CEDEAR badge */}
                <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-md bg-surface-raised px-2 py-0.5 text-xs font-medium text-text-muted">
                    {ticker.market}
                  </span>
                  {ticker.is_cedear && (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      CEDEAR
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
