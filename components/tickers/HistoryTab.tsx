'use client'

/**
 * HistoryTab — paginated OHLC price history table + PriceChart.
 *
 * Controls:
 *   - Granularity pill selector: 1D | 1W | 1M | 1Y | ALL
 *     1D = every trading day, 1W = Mondays, 1M = first day of each month,
 *     1Y = last available day of each year, ALL = all records unpaginated.
 *   - Page size select: 10 | 20 | 50 | 100 (hidden when granularity = ALL)
 *
 * Layout:
 *   Controls row (granularity pills + page size select)
 *   PriceChart (area chart of close prices for current page/all data)
 *   ─────────────────────────────────────────────────────────────────
 *   Table: Date | Open | High | Low | Close | Dividend
 *   Pagination: Previous / Page N of M · X <unit> / Next
 *     (hidden when granularity = ALL)
 *
 * Usage:
 *   <HistoryTab symbol="AAPL" />
 */

import { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getTickerHistory } from '@/services/tickers.service'
import { PriceChart } from './PriceChart'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { PaginatedResponse, TickerHistoryEntry, HistoryGranularity } from '@/lib/types'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

const GRANULARITY_OPTIONS: { value: HistoryGranularity; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'All' },
]

/** Human-readable unit label for the pagination footer. */
const GRANULARITY_UNIT: Record<HistoryGranularity, string> = {
  '1D': 'days',
  '1W': 'weeks',
  '1M': 'months',
  '1Y': 'years',
  ALL: 'entries',
}

interface HistoryTabProps {
  symbol: string
}

type HistoryData =
  | { kind: 'paginated'; data: PaginatedResponse<TickerHistoryEntry> }
  | { kind: 'all'; data: TickerHistoryEntry[] }

async function loadPage(
  symbol: string,
  page: number,
  pageSize: number,
  granularity: HistoryGranularity,
  setData: (d: HistoryData) => void,
  setError: (e: string) => void,
  setLoading: (l: boolean) => void
) {
  setLoading(true)
  setError('')
  try {
    const result = await getTickerHistory(symbol, { page, page_size: pageSize, granularity })
    if (Array.isArray(result)) {
      setData({ kind: 'all', data: result })
    } else {
      setData({ kind: 'paginated', data: result })
    }
  } catch {
    setError('Could not load price history.')
  } finally {
    setLoading(false)
  }
}

const TH = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary'
const TD = 'px-4 py-3 text-sm tabular-nums text-text-primary'

export function HistoryTab({ symbol }: HistoryTabProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [granularity, setGranularity] = useState<HistoryGranularity>('1D')
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const setHistoryDataRef = useRef(setHistoryData)
  const setErrorRef = useRef(setError)
  const setLoadingRef = useRef(setLoading)

  useEffect(() => {
    loadPage(
      symbol,
      page,
      pageSize,
      granularity,
      setHistoryDataRef.current,
      setErrorRef.current,
      setLoadingRef.current
    )
  }, [symbol, page, pageSize, granularity])

  function handleGranularityChange(g: HistoryGranularity) {
    setGranularity(g)
    setPage(1)
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size)
    setPage(1)
  }

  const isAll = granularity === 'ALL'
  const entries: TickerHistoryEntry[] =
    historyData == null
      ? []
      : historyData.kind === 'all'
        ? historyData.data
        : historyData.data.results

  const totalCount =
    historyData == null
      ? 0
      : historyData.kind === 'all'
        ? historyData.data.length
        : historyData.data.count

  const totalPages = isAll ? 1 : Math.ceil(totalCount / pageSize)

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse" aria-busy="true">
        <div className="h-10 rounded-lg bg-surface w-64" />
        <div className="h-[260px] rounded-xl bg-surface" />
        <div className="h-64 rounded-xl bg-surface" />
      </div>
    )
  }

  if (error) {
    return <p className="py-12 text-center text-sm text-text-secondary">{error}</p>
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Granularity pills */}
        <div
          className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1"
          role="group"
          aria-label="Time granularity"
        >
          {GRANULARITY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleGranularityChange(value)}
              aria-pressed={granularity === value}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                granularity === value
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Page size select — hidden for ALL */}
        {!isAll && (
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            Show
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
              aria-label="Entries per page"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            per page
          </label>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-muted">No price history available.</p>
      ) : (
        <>
          {/* Chart */}
          <PriceChart entries={entries} />

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] border-collapse">
                <caption className="sr-only">Price history for {symbol}</caption>
                <thead>
                  <tr className="border-b border-border bg-surface-raised">
                    <th className={TH}>Date</th>
                    <th className={cn(TH, 'text-right')}>Open</th>
                    <th className={cn(TH, 'text-right')}>High</th>
                    <th className={cn(TH, 'text-right')}>Low</th>
                    <th className={cn(TH, 'text-right')}>Close</th>
                    <th className={cn(TH, 'text-right')}>Dividend</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-surface-raised"
                    >
                      <td className={cn(TD, 'text-text-secondary')}>{formatDate(entry.date)}</td>
                      <td className={cn(TD, 'text-right')}>{formatCurrency(entry.open_price)}</td>
                      <td className={cn(TD, 'text-right')}>{formatCurrency(entry.max_price)}</td>
                      <td className={cn(TD, 'text-right')}>{formatCurrency(entry.min_price)}</td>
                      <td className={cn(TD, 'text-right font-medium')}>
                        {formatCurrency(entry.close_price)}
                      </td>
                      <td className={cn(TD, 'text-right text-text-secondary')}>
                        {entry.dividend_amount ? formatNumber(entry.dividend_amount) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination — hidden for ALL */}
          {!isAll && totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} aria-hidden="true" />
                Previous
              </button>

              <span className="text-xs text-text-muted">
                Page {page} of {totalPages} · {totalCount} {GRANULARITY_UNIT[granularity]}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

