/**
 * TransactionList — displays a list of transactions in a responsive table.
 *
 * Columns: Date | Type | Ticker | Qty | Price | Amount | Notes | Actions
 *
 * Type badge colors:
 *   BUY     → blue
 *   SELL    → purple
 *   INCOME  → green
 *   EXPENSE → red
 *
 * Actions: Edit (link to /portfolio/[id]/edit) | Delete (calls onDelete)
 *
 * Empty state is shown when the filtered list is empty.
 *
 * Usage:
 *   <TransactionList
 *     transactions={transactions}
 *     onDelete={(id) => handleDelete(id)}
 *     isDeleting={deletingId}
 *   />
 */

import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import type { Transaction, TransactionType } from '@/lib/types'

interface TransactionListProps {
  transactions: Transaction[]
  onDelete: (id: number) => void
  /** ID of the transaction currently being deleted (shows spinner). */
  isDeleting?: number | null
}

const TYPE_BADGE: Record<TransactionType, string> = {
  BUY: 'bg-brand-subtle text-brand',
  SELL: 'bg-surface-raised text-text-secondary border border-border',
  INCOME: 'bg-gain-bg text-gain border border-gain-border',
  EXPENSE: 'bg-loss-bg text-loss border border-loss-border',
}

const TH = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary'
const TD = 'px-4 py-3 text-sm text-text-primary'

export function TransactionList({ transactions, onDelete, isDeleting }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface py-16 text-center">
        <p className="text-sm font-medium text-text-secondary">No transactions found</p>
        <p className="text-xs text-text-muted">
          Try changing your filters, or add a new transaction.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <caption className="sr-only">Transaction history</caption>
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              <th className={TH}>Date</th>
              <th className={TH}>Type</th>
              <th className={TH}>Ticker</th>
              <th className={cn(TH, 'text-right')}>Qty</th>
              <th className={cn(TH, 'text-right')}>Price</th>
              <th className={cn(TH, 'text-right')}>Amount</th>
              <th className={TH}>Notes</th>
              <th className={cn(TH, 'text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-border transition-colors last:border-0 hover:bg-surface-raised"
              >
                {/* Date */}
                <td className={cn(TD, 'whitespace-nowrap tabular-nums text-text-secondary')}>
                  {formatDate(tx.date)}
                </td>

                {/* Type badge */}
                <td className={TD}>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
                      TYPE_BADGE[tx.transaction_type]
                    )}
                  >
                    {tx.transaction_type}
                  </span>
                </td>

                {/* Ticker */}
                <td className={TD}>
                  {tx.ticker ? (
                    <Link
                      href={`/tickers/${tx.ticker.symbol}`}
                      className="font-semibold text-brand hover:underline"
                    >
                      {tx.ticker.symbol}
                    </Link>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>

                {/* Quantity */}
                <td className={cn(TD, 'text-right tabular-nums')}>
                  {tx.quantity ? formatNumber(tx.quantity, 4) : '—'}
                </td>

                {/* Price per unit */}
                <td className={cn(TD, 'text-right tabular-nums')}>
                  {tx.price_per_unit ? formatCurrency(tx.price_per_unit) : '—'}
                </td>

                {/* Amount */}
                <td className={cn(TD, 'text-right tabular-nums font-medium')}>
                  {formatCurrency(tx.amount)}
                </td>

                {/* Notes */}
                <td className={cn(TD, 'max-w-[160px] truncate text-text-secondary')}>
                  {tx.notes || <span className="text-text-muted">—</span>}
                </td>

                {/* Actions */}
                <td className={cn(TD, 'text-right')}>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/portfolio/${tx.id}/edit`}
                      aria-label={`Edit ${tx.transaction_type} transaction on ${formatDate(tx.date)}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
                    >
                      <Pencil size={13} aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(tx.id)}
                      disabled={isDeleting === tx.id}
                      aria-label={`Delete ${tx.transaction_type} transaction on ${formatDate(tx.date)}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-loss-bg hover:text-loss disabled:opacity-50"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
