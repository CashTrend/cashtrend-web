'use client'

/**
 * Tickers search page — live search with debounce, result cards.
 *
 * Behaviour:
 *   - Input with 300ms debounce calls searchTickers()
 *   - Results shown as clickable cards → /tickers/[symbol]
 *   - Empty state when query is blank; "no results" when search returns []
 *   - Loading spinner while fetching
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Loader2, TrendingUp } from 'lucide-react'
import { searchTickers } from '@/services/tickers.service'
import { cn } from '@/lib/utils'
import type { Ticker } from '@/lib/types'

export default function TickersPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Ticker[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchError, setSearchError] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()

    const timer = setTimeout(async () => {
      if (trimmed.length === 0) {
        setResults([])
        setSearched(false)
        setSearchError(false)
        setLoading(false)
        return
      }
      setLoading(true)
      setSearchError(false)
      try {
        const data = await searchTickers(trimmed)
        setResults(data)
        setSearched(true)
      } catch {
        setResults([])
        setSearched(true)
        setSearchError(true)
      } finally {
        setLoading(false)
      }
    }, trimmed.length === 0 ? 0 : 300)

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
          placeholder="Search by symbol or company name…"
          aria-label="Search tickers"
          autoFocus
          className={cn(
            'w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm',
            'text-text-primary placeholder:text-text-muted outline-none shadow-sm transition-colors',
            'focus:border-brand focus:ring-2 focus:ring-brand/20'
          )}
        />
      </div>

      {/* Results */}
      {!query.trim() && (
        <p className="text-sm text-text-muted">Type a symbol or company name to search.</p>
      )}

      {searched && !loading && searchError && (
        <p className="text-sm text-loss">
          Search failed. Check your connection and try again.
        </p>
      )}

      {searched && !loading && !searchError && results.length === 0 && (
        <p className="text-sm text-text-secondary">
          No results for <span className="font-semibold">&ldquo;{query}&rdquo;</span>.
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

                {/* Market badge */}
                <span className="ml-auto shrink-0 rounded-md bg-surface-raised px-2 py-0.5 text-xs font-medium text-text-muted">
                  {ticker.market}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
