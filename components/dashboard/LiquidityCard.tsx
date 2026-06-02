/**
 * LiquidityCard — dedicated card for the portfolio's available cash (liquidity).
 *
 * Shows:
 *   - Available cash balance (total_liquidity from the summary)
 *   - A subtle breakdown hint: INCOME - EXPENSE - BUY costs + SELL proceeds
 *
 * Uses a distinct visual treatment (wallet icon, slightly different accent)
 * to differentiate cash from invested positions.
 *
 * Usage:
 *   <LiquidityCard liquidity={summary.total_liquidity} />
 */

import { Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, getPnlDirection } from '@/lib/utils'

interface LiquidityCardProps {
  /** Decimal string from PortfolioSummary.total_liquidity */
  liquidity: string
  /** ISO 4217 currency code for display (default 'USD') */
  currency?: string
  className?: string
}

export function LiquidityCard({ liquidity, currency = 'USD', className }: LiquidityCardProps) {
  const direction = getPnlDirection(liquidity)

  const valueColorClass =
    direction === 'gain' ? 'text-gain' : direction === 'loss' ? 'text-loss' : 'text-text-primary'

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Available Cash
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-subtle text-brand">
          <Wallet size={14} aria-hidden="true" />
        </span>
      </div>

      {/* Value */}
      <p className={cn('text-2xl font-bold tabular-nums', valueColorClass)}>
        {formatCurrency(liquidity, currency)}
      </p>

      {/* Description */}
      <span className="text-xs text-text-muted">Income − Expenses − Buys + Sells</span>
    </div>
  )
}
