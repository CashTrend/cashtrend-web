/**
 * Portfolio domain types — mirrors the portfolio/ app API contracts.
 *
 * NOTE: All decimal fields from the backend are returned as strings in JSON.
 * Always parse with `new Decimal(value)` from decimal.js, never with parseFloat.
 */

/** Valid transaction type values. */
export type TransactionType = 'BUY' | 'SELL' | 'INCOME' | 'EXPENSE'

/** Minimal ticker info embedded in a transaction read response. */
export interface TransactionTicker {
  symbol: string
  name: string
  type: string
  market: string
  currency: string
  /**
   * How many CEDEAR units represent one underlying foreign share.
   * Null for non-CEDEAR tickers. Decimal as string.
   */
  conversion_ratio: string | null
  /** True when this ticker is a CEDEAR. */
  is_cedear: boolean
}

/** A transaction as returned by the API (read shape). */
export interface Transaction {
  id: number
  transaction_type: TransactionType
  /** Null for INCOME/EXPENSE transactions. */
  ticker: TransactionTicker | null
  /** Null for INCOME/EXPENSE transactions. Decimal as string. */
  quantity: string | null
  /** Null for INCOME/EXPENSE transactions. Decimal as string. */
  price_per_unit: string | null
  /** Auto-computed for BUY/SELL. Decimal as string. */
  amount: string
  date: string
  notes: string
  created_at: string
  updated_at: string
}

/**
 * Request body for creating a BUY or SELL transaction.
 * IMPORTANT: Never include `amount` — it is auto-computed by the backend.
 */
export interface CreateTickerTransactionRequest {
  transaction_type: 'BUY' | 'SELL'
  ticker: string
  quantity: string
  price_per_unit: string
  date: string
  notes?: string
}

/**
 * Request body for creating an INCOME or EXPENSE transaction.
 * Fields `ticker`, `quantity`, and `price_per_unit` must not be included.
 */
export interface CreateCashTransactionRequest {
  transaction_type: 'INCOME' | 'EXPENSE'
  amount: string
  date: string
  notes?: string
}

/** Union type for transaction creation — use discriminated union on transaction_type. */
export type CreateTransactionRequest = CreateTickerTransactionRequest | CreateCashTransactionRequest

/** Partial version for PATCH updates — all fields optional. */
export type UpdateTransactionRequest = Partial<CreateTransactionRequest>

/** Query params for GET /api/portfolio/transactions */
export interface TransactionListParams {
  type?: TransactionType
  ticker?: string
}

/** Single holding in the portfolio summary. */
export interface Holding {
  symbol: string
  ticker_name: string
  /** Decimal as string. */
  net_quantity: string
  /** Weighted average buy price. Decimal as string. */
  avg_buy_price: string
  /** avg_buy_price × net_quantity. Decimal as string. */
  total_invested: string
  /** Latest close price from TickerHistory. Decimal as string or null. */
  current_price: string | null
  /** current_price × net_quantity. Decimal as string or null. */
  current_value: string | null
  /** current_value - total_invested. Decimal as string or null. */
  pnl_amount: string | null
  /** (pnl_amount / total_invested) × 100. Decimal as string or null. */
  pnl_percent: string | null
  /** True when this holding's ticker is a CEDEAR. */
  is_cedear: boolean
}

/** Full portfolio summary returned by GET /api/portfolio/summary. */
export interface PortfolioSummary {
  /** Net cash (INCOME - EXPENSE - BUY costs + SELL proceeds). Decimal as string. */
  total_liquidity: string
  /** Total capital in open positions. Decimal as string. */
  total_invested: string
  /** Current market value of all holdings. Decimal as string. */
  total_current_value: string
  /** total_current_value - total_invested. Decimal as string. */
  total_pnl_amount: string
  /** (total_pnl_amount / total_invested) × 100. Null if total_invested is 0. */
  total_pnl_percent: string | null
  holdings: Holding[]
}
