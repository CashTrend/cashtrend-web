/**
 * Tickers service — wraps all ticker-related endpoints.
 *
 * Endpoints covered:
 *   GET /api/tickers/search?query=
 *   GET /api/tickers/{symbol}/detail
 *   GET /api/tickers/{symbol}/history
 *   GET /api/tickers/{symbol}/income
 *   GET /api/tickers/{symbol}/balance
 *   GET /api/tickers/{symbol}/cashflow
 *
 * All endpoints require authentication (Bearer token).
 * No trailing slashes on ticker endpoints (SimpleRouter trailing_slash=False).
 */

import { http } from '@/services/http'
import type {
  Ticker,
  TickerDetail,
  TickerHistoryEntry,
  TickerIncome,
  TickerBalance,
  TickerCashFlow,
  TickerHistoryParams,
  PaginatedResponse,
} from '@/lib/types'

/**
 * Search for tickers by symbol or name.
 * Returns up to 8 results. Falls back to live Yahoo Finance search if
 * fewer than 8 DB results are found.
 *
 * Pass an AbortSignal to cancel an in-flight search when the query changes
 * (e.g. from an AbortController tied to a useEffect cleanup).
 *
 * @param query  - Partial symbol or company name (e.g. 'AAPL', 'Apple')
 * @param signal - Optional AbortSignal to cancel the request mid-flight
 * @returns Array of matching tickers
 */
export async function searchTickers(query: string, signal?: AbortSignal): Promise<Ticker[]> {
  return http.get<Ticker[]>('/api/tickers/search', { query }, true, signal)
}

/**
 * Retrieve full ticker details including all financial ratios.
 * Data is refreshed daily on the backend if stale.
 *
 * NOTE: Despite the name, `tickerratios_set` in the response is a single
 * nested object, not an array.
 *
 * @param symbol - Ticker symbol (case-insensitive, e.g. 'AAPL')
 * @returns Full ticker detail with embedded ratios
 */
export async function getTickerDetail(symbol: string): Promise<TickerDetail> {
  return http.get<TickerDetail>(`/api/tickers/${symbol}/detail`)
}

/**
 * Retrieve paginated OHLC price history for a ticker with optional granularity.
 * Results are ordered newest-first.
 *
 * Granularity controls which data points are returned:
 *   1D (default) — every trading day
 *   1W — one point per week (Mondays only)
 *   1M — one point per month (first day of each month)
 *   1Y — one point per year (last available day of each year)
 *   ALL — all records, no pagination (returns full array, not paginated response)
 *
 * @param symbol - Ticker symbol (case-insensitive)
 * @param params - page, page_size (max 100), granularity
 * @returns DRF paginated response (or plain array when granularity is ALL)
 */
export async function getTickerHistory(
  symbol: string,
  params: TickerHistoryParams = {}
): Promise<PaginatedResponse<TickerHistoryEntry> | TickerHistoryEntry[]> {
  const queryParams: Record<string, string | number> = {}

  if (params.granularity && params.granularity !== 'ALL') {
    queryParams['granularity'] = params.granularity
  }
  if (params.granularity === 'ALL') {
    queryParams['granularity'] = 'ALL'
    // No page / page_size for ALL — backend returns unpaginated list
    return http.get<TickerHistoryEntry[]>(`/api/tickers/${symbol}/history`, queryParams)
  }
  if (params.page !== undefined) queryParams['page'] = params.page
  if (params.page_size !== undefined) queryParams['page_size'] = params.page_size

  return http.get<PaginatedResponse<TickerHistoryEntry>>(
    `/api/tickers/${symbol}/history`,
    queryParams
  )
}

/**
 * Retrieve annual income statements for a ticker.
 * Results are ordered newest-first. No pagination.
 *
 * @param symbol - Ticker symbol (case-insensitive)
 * @returns Array of annual income statement entries
 */
export async function getTickerIncome(symbol: string): Promise<TickerIncome[]> {
  return http.get<TickerIncome[]>(`/api/tickers/${symbol}/income`)
}

/**
 * Retrieve annual balance sheets for a ticker.
 * Results are ordered newest-first. No pagination.
 *
 * @param symbol - Ticker symbol (case-insensitive)
 * @returns Array of annual balance sheet entries
 */
export async function getTickerBalance(symbol: string): Promise<TickerBalance[]> {
  return http.get<TickerBalance[]>(`/api/tickers/${symbol}/balance`)
}

/**
 * Retrieve annual cash flow statements for a ticker.
 * Results are ordered newest-first. No pagination.
 *
 * @param symbol - Ticker symbol (case-insensitive)
 * @returns Array of annual cash flow entries
 */
export async function getTickerCashflow(symbol: string): Promise<TickerCashFlow[]> {
  return http.get<TickerCashFlow[]>(`/api/tickers/${symbol}/cashflow`)
}

/**
 * Mark an existing ticker as a CEDEAR (Argentine deposit certificate).
 *
 * Sets the ticker's type to "CEDEAR", currency to "ARS", and stores the
 * conversion ratio — how many CEDEAR units equal one underlying foreign share.
 *
 * This action is reversible. Calling it again with a different conversion_ratio
 * updates the stored value.
 *
 * @param symbol - Ticker symbol to mark (e.g. 'AAPL.BA')
 * @param conversionRatio - Positive decimal string (e.g. '10' for 10:1 ratio)
 * @returns Full updated ticker detail
 */
export async function markAsCedear(symbol: string, conversionRatio: string): Promise<TickerDetail> {
  return http.patch<TickerDetail>(`/api/tickers/${symbol}/mark-cedear`, {
    conversion_ratio: conversionRatio,
  })
}
