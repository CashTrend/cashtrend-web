/**
 * HoldingsTable — lists all open portfolio positions with P&L data.
 *
 * Columns:
 *   Symbol / Name | Qty | Avg Buy Price | Total Invested | Current Price | Current Value | P&L
 *
 * Handles edge cases:
 *   - current_price null → shows '—' for price, value, and P&L columns
 *   - Empty holdings     → renders an empty-state message
 *
 * Each row links to /tickers/[symbol] for the detail view (Phase 5).
 *
 * Usage:
 *   <HoldingsTable holdings={summary.holdings} />
 */

import Link from 'next/link'
import { PnLBadge } from './PnLBadge'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { Holding } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HoldingsTableProps {
  holdings: Holding[]
  className?: string
}

const TH = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary'
const TD = 'px-4 py-3 text-sm tabular-nums text-text-primary'

export function HoldingsTable({ holdings, className }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface py-16 text-center',
          className
        )}
      >
        <p className="text-sm font-medium text-text-secondary">No open positions</p>
        <p className="text-xs text-text-muted">
          Add a BUY transaction in Portfolio to start tracking your holdings.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-surface shadow-sm',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <caption className="sr-only">Open portfolio positions</caption>
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              <th className={TH}>Ticker</th>
              <th className={cn(TH, 'text-right')}>Qty</th>
              <th className={cn(TH, 'text-right')}>Avg Buy</th>
              <th className={cn(TH, 'text-right')}>Invested</th>
              <th className={cn(TH, 'text-right')}>Price</th>
              <th className={cn(TH, 'text-right')}>Value</th>
              <th className={cn(TH, 'text-right')}>P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => (
              <tr
                key={h.symbol}
                className={cn(
                  'border-b border-border transition-colors last:border-0 hover:bg-surface-raised',
                  i % 2 === 0 ? '' : 'bg-background/40'
                )}
              >
                {/* Symbol + name */}
                <td className={TD}>
                  <Link href={`/tickers/${h.symbol}`} className="group flex flex-col">
                    <span className="font-semibold text-brand group-hover:underline">
                      {h.symbol}
                    </span>
                    <span className="text-xs text-text-muted">{h.ticker_name}</span>
                  </Link>
                </td>

                {/* Quantity */}
                <td className={cn(TD, 'text-right')}>{formatNumber(h.net_quantity, 4)}</td>

                {/* Avg buy price */}
                <td className={cn(TD, 'text-right')}>{formatCurrency(h.avg_buy_price)}</td>

                {/* Total invested */}
                <td className={cn(TD, 'text-right')}>{formatCurrency(h.total_invested)}</td>

                {/* Current price */}
                <td className={cn(TD, 'text-right')}>{formatCurrency(h.current_price)}</td>

                {/* Current value */}
                <td className={cn(TD, 'text-right')}>{formatCurrency(h.current_value)}</td>

                {/* P&L */}
                <td className={cn(TD, 'text-right')}>
                  {h.pnl_amount != null ? (
                    <PnLBadge amount={h.pnl_amount} percent={h.pnl_percent} size="sm" />
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
