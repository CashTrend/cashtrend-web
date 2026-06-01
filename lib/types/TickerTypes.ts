/**
 * Ticker domain types — mirrors the tickers/ app API contracts.
 *
 * NOTE: All decimal fields from the backend are returned as strings in JSON.
 * Always parse with `new Decimal(value)` from decimal.js, never with parseFloat.
 */

/** Ticker search result and list item. */
export interface Ticker {
  symbol: string
  name: string
  type: string
  market: string
  industry: string
  sector: string
  /** Currency in which the ticker's prices are denominated ('USD' or 'ARS'). */
  currency: string
  /**
   * How many CEDEAR units represent one underlying foreign share.
   * Null for non-CEDEAR tickers. Decimal as string.
   */
  conversion_ratio: string | null
}

/** Financial ratios — all fields nullable, decimals as strings. */
export interface TickerRatios {
  beta: string | null
  pe_ratio_past: string | null
  pe_ratio_forward: string | null
  eps_past: string | null
  eps_forward: string | null
  peg_ratio: string | null
  ps_ratio: string | null
  pb_ratio: string | null
  dividend_yield: string | null
  dividend_date: string | null
  ex_dividend_date: string | null
  gross_margin: string | null
  operating_margin: string | null
  ebitda_margin: string | null
  net_profit_margin: string | null
  operating_cash_flow: string | null
  free_cash_flow: string | null
  roa_ratio: string | null
  roe_ratio: string | null
  leverage_ratio: string | null
  ev_income_ratio: string | null
  ev_ebitda_ratio: string | null
}

/**
 * Full ticker detail including ratios.
 * Note: despite the name, `tickerratios_set` is a single nested object, not an array.
 */
export interface TickerDetail {
  symbol: string
  name: string
  type: string
  market: string
  industry: string
  sector: string
  /** Currency in which the ticker's prices are denominated ('USD' or 'ARS'). */
  currency: string
  /**
   * How many CEDEAR units represent one underlying foreign share.
   * Null for non-CEDEAR tickers. Decimal as string.
   */
  conversion_ratio: string | null
  description: string
  created_date: string
  update_date: string
  /**
   * Financial ratios for the ticker.
   * Null for CEDEARs and tickers without a ratios record (e.g. some crypto).
   * The RatiosTab renders a "no data" message when this is null.
   */
  tickerratios_set: TickerRatios | null
}

/** Single daily OHLC entry — decimals as strings. */
export interface TickerHistoryEntry {
  id: number
  date: string
  open_price: string
  close_price: string
  max_price: string
  min_price: string
  dividend_amount: string | null
}

/** DRF paginated response wrapper. Only history endpoint uses pagination. */
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Annual income statement entry — decimals as strings. */
export interface TickerIncome {
  id: number
  date: string
  total_profit: string | null
  gross_profit: string | null
  operating_profit: string | null
  taxes_profit: string | null
  net_profit: string | null
  ebit: string | null
  ebitda: string | null
}

/** Annual balance sheet entry — decimals as strings. */
export interface TickerBalance {
  id: number
  date: string
  current_assets: string | null
  no_current_assets: string | null
  current_liabilities: string | null
  no_current_liabilities: string | null
  equity_net: string | null
}

/** Annual cash flow statement entry — decimals as strings. */
export interface TickerCashFlow {
  id: number
  date: string
  operating_cash_flow: string | null
  investing_cash_flow: string | null
  financing_cash_flow: string | null
}

/** Query params for GET /api/tickers/search */
export interface TickerSearchParams {
  query: string
}

/** Temporal granularity for the history endpoint. */
export type HistoryGranularity = '1D' | '1W' | '1M' | '1Y' | 'ALL'

/** Query params for GET /api/tickers/{symbol}/history */
export interface TickerHistoryParams {
  page?: number
  page_size?: number
  granularity?: HistoryGranularity
}
