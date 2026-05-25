/**
 * PnLBadge — displays a profit/loss indicator with optional amount and percentage.
 *
 * Color logic:
 *   positive value → green (--color-gain)
 *   negative value → red  (--color-loss)
 *   zero / null    → muted
 *
 * Usage:
 *   <PnLBadge amount="1234.56" percent="12.34" />
 *   <PnLBadge amount="-500.00" />
 *   <PnLBadge percent={holding.pnl_percent} size="sm" />
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent, getPnlDirection } from '@/lib/utils'

type PnLDirection = 'gain' | 'loss' | 'neutral'

interface PnLBadgeProps {
  /** Primary value used to determine direction (amount takes precedence over percent). */
  amount?: string | number | null
  /** Percentage value (e.g. "12.34" = 12.34%). Shown alongside amount when provided. */
  percent?: string | number | null
  /** Visual size variant. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'text-xs gap-1 px-1.5 py-0.5',
  md: 'text-sm gap-1.5 px-2 py-1',
  lg: 'text-base gap-2 px-2.5 py-1',
}

const ICON_SIZE = { sm: 12, md: 14, lg: 16 }

const DIRECTION_CLASSES: Record<PnLDirection, string> = {
  gain: 'text-gain bg-gain-bg border border-gain-border',
  loss: 'text-loss bg-loss-bg border border-loss-border',
  neutral: 'text-text-muted bg-surface-raised border border-border',
}

/**
 * Returns the trend icon for a given P&L direction.
 */
function PnLIcon({ direction, size }: { direction: PnLDirection; size: number }) {
  if (direction === 'gain') return <TrendingUp size={size} aria-hidden="true" />
  if (direction === 'loss') return <TrendingDown size={size} aria-hidden="true" />
  return <Minus size={size} aria-hidden="true" />
}

export function PnLBadge({ amount, percent, size = 'md', className }: PnLBadgeProps) {
  // Determine direction from amount first, then fall back to percent
  const direction = getPnlDirection(amount ?? percent)

  const amountText = amount != null ? formatCurrency(amount) : null
  const percentText = percent != null ? formatPercent(percent) : null

  // At least one value must be renderable
  if (!amountText && !percentText) {
    return <span className="text-sm text-text-muted">—</span>
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium tabular-nums',
        SIZE_CLASSES[size],
        DIRECTION_CLASSES[direction],
        className
      )}
      aria-label={[amountText, percentText].filter(Boolean).join(' ')}
    >
      <PnLIcon direction={direction} size={ICON_SIZE[size]} />
      {amountText && <span>{amountText}</span>}
      {percentText && <span className="opacity-80">({percentText})</span>}
    </span>
  )
}
