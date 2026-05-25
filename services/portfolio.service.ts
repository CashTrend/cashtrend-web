/**
 * Portfolio service — wraps all portfolio-related endpoints.
 *
 * Endpoints covered:
 *   GET    /api/portfolio/summary
 *   GET    /api/portfolio/transactions
 *   GET    /api/portfolio/transactions/{id}
 *   POST   /api/portfolio/transactions
 *   PUT    /api/portfolio/transactions/{id}
 *   PATCH  /api/portfolio/transactions/{id}
 *   DELETE /api/portfolio/transactions/{id}
 *
 * All endpoints require authentication (Bearer token).
 * All data is scoped to the authenticated user — no cross-user access.
 *
 * CRITICAL: Never send `amount` in a BUY/SELL request body.
 * The backend auto-computes it as quantity × price_per_unit.
 * The CreateTransactionRequest union type enforces this at the type level.
 */

import { http } from '@/services/http'
import type {
  Transaction,
  TransactionListParams,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  PortfolioSummary,
} from '@/lib/types'

/**
 * Retrieve the full portfolio summary for the authenticated user.
 * Uses only DB data — no live Yahoo Finance calls at read time.
 * Current prices are sourced from the latest TickerHistory close price.
 *
 * @returns Portfolio summary with liquidity, total value, P&L, and holdings
 */
export async function getSummary(): Promise<PortfolioSummary> {
  return http.get<PortfolioSummary>('/api/portfolio/summary')
}

/**
 * List all transactions for the authenticated user.
 * Supports optional filtering by transaction type and ticker symbol.
 * Returns a flat array (no pagination).
 *
 * @param params - Optional filters: type (BUY/SELL/INCOME/EXPENSE), ticker (symbol)
 * @returns Array of transactions ordered by the backend default
 */
export async function getTransactions(params: TransactionListParams = {}): Promise<Transaction[]> {
  const queryParams: Record<string, string> = {}
  if (params.type) queryParams['type'] = params.type
  if (params.ticker) queryParams['ticker'] = params.ticker

  return http.get<Transaction[]>('/api/portfolio/transactions', queryParams)
}

/**
 * Retrieve a single transaction by its integer ID.
 *
 * @param id - Transaction primary key
 * @returns The transaction object
 */
export async function getTransaction(id: number): Promise<Transaction> {
  return http.get<Transaction>(`/api/portfolio/transactions/${id}`)
}

/**
 * Create a new transaction.
 *
 * For BUY/SELL: provide ticker, quantity, price_per_unit, date (and optionally notes).
 * Do NOT include `amount` — it is auto-computed by the backend.
 *
 * For INCOME/EXPENSE: provide amount, date (and optionally notes).
 * Do NOT include ticker, quantity, or price_per_unit.
 *
 * @param payload - Transaction creation data (type-safe union)
 * @returns The created transaction with its assigned ID and computed fields
 */
export async function createTransaction(payload: CreateTransactionRequest): Promise<Transaction> {
  return http.post<Transaction>('/api/portfolio/transactions', payload)
}

/**
 * Fully replace a transaction (PUT — all required fields must be present).
 *
 * @param id - Transaction primary key
 * @param payload - Full replacement data
 * @returns The updated transaction
 */
export async function replaceTransaction(
  id: number,
  payload: CreateTransactionRequest
): Promise<Transaction> {
  return http.put<Transaction>(`/api/portfolio/transactions/${id}`, payload)
}

/**
 * Partially update a transaction (PATCH — only include fields to change).
 *
 * @param id - Transaction primary key
 * @param payload - Partial update data
 * @returns The updated transaction
 */
export async function updateTransaction(
  id: number,
  payload: UpdateTransactionRequest
): Promise<Transaction> {
  return http.patch<Transaction>(`/api/portfolio/transactions/${id}`, payload)
}

/**
 * Delete a transaction by its ID.
 * Returns void on success (204 No Content).
 *
 * @param id - Transaction primary key
 */
export async function deleteTransaction(id: number): Promise<void> {
  return http.del<void>(`/api/portfolio/transactions/${id}`)
}
