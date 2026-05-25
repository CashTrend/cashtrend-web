'use client'

/**
 * HistoryTab — paginated OHLC price history table + PriceChart.
 *
 * Controls:
 *   - Granularity pill selector: 1D | 1W | 1M | 1Y | ALL
 *   - Page size select (hidden for ALL)
 */

import { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getTickerHistory } from '@/services/tickers.service'
import { PriceChart } from './PriceChart'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useLocale } from '@/context/locale-context'
import { interpolate } from '@/lib/i18n/types'
import type { PaginatedResponse, TickerHistoryEntry, HistoryGranularity } from '@/lib/types'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

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
  errorMsg: string,
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
    setError(errorMsg)
  } finally {
    setLoading(false)
  }
}

const TH = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary'
const TD = 'px-4 py-3 text-sm tabular-nums text-text-primary'

export function HistoryTab({ symbol }: HistoryTabProps) {
  const { t } = useLocale()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [granularity, setGranularity] = useState<HistoryGranularity>('1D')
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const setHistoryDataRef = useRef(setHistoryData)
  const setErrorRef = useRef(setError)
  const setLoadingRef = useRef(setLoading)

  const GRANULARITY_UNIT: Record<HistoryGranularity, string> = {
    '1D': t.tickers.history.unit_days,
    '1W': t.tickers.history.unit_weeks,
    '1M': t.tickers.history.unit_months,
    '1Y': t.tickers.history.unit_years,
    ALL: t.tickers.history.unit_entries,
  }

  const GRANULARITY_OPTIONS: { value: HistoryGranularity; label: string }[] = [
    { value: '1D', label: '1D' },
    { value: '1W', label: '1W' },
    { value: '1M', label: '1M' },
    { value: '1Y', label: '1Y' },
    { value: 'ALL', label: t.tickers.history.granularity_all },
  ]

  useEffect(() => {
    loadPage(
      symbol,
      page,
      pageSize,
      granularity,
      t.tickers.history.error,
      setHistoryDataRef.current,
      setErrorRef.current,
      setLoadingRef.current
    )
  }, [symbol, page, pageSize, granularity, t.tickers.history.error])

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
          aria-label={t.tickers.history.granularity_aria}
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
            {t.tickers.history.show_label}
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
              aria-label={t.tickers.history.entries_per_page_aria}
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {t.tickers.history.per_page}
          </label>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-muted">{t.tickers.history.no_data}</p>
      ) : (
        <>
          {/* Chart */}
          <PriceChart entries={entries} />

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] border-collapse">
                <caption className="sr-only">
                  {interpolate(t.tickers.history.caption, { symbol })}
                </caption>
                <thead>
                  <tr className="border-b border-border bg-surface-raised">
                    <th className={TH}>{t.tickers.history.col_date}</th>
                    <th className={cn(TH, 'text-right')}>{t.tickers.history.col_open}</th>
                    <th className={cn(TH, 'text-right')}>{t.tickers.history.col_high}</th>
                    <th className={cn(TH, 'text-right')}>{t.tickers.history.col_low}</th>
                    <th className={cn(TH, 'text-right')}>{t.tickers.history.col_close}</th>
                    <th className={cn(TH, 'text-right')}>{t.tickers.history.col_dividend}</th>
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
                {t.tickers.history.prev}
              </button>

              <span className="text-xs text-text-muted">
                {interpolate(t.tickers.history.page_info, {
                  page: String(page),
                  total: String(totalPages),
                  count: String(totalCount),
                  unit: GRANULARITY_UNIT[granularity],
                })}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.tickers.history.next}
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
