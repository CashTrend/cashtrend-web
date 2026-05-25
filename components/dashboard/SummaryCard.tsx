/**
 * SummaryCard — a single KPI metric tile for the dashboard overview row.
 *
 * Shows:
 *   - Icon (optional, top-left)
 *   - Label (metric name)
 *   - Primary value (formatted currency / number)
 *   - Optional PnLBadge below the value
 *   - Optional trend description text
 *
 * Usage:
 *   <SummaryCard
 *     label="Portfolio Value"
 *     value={formatCurrency(summary.total_current_value)}
 *     icon={<BarChart2 size={16} />}
 *     badge={<PnLBadge amount={summary.total_pnl_amount} percent={summary.total_pnl_percent} size="sm" />}
 *   />
 */

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SummaryCardProps {
  label: string
  value: string
  /** Lucide icon element rendered in the card header. */
  icon?: ReactNode
  /** Optional PnLBadge or any extra element shown below the value. */
  badge?: ReactNode
  /** Small secondary description line beneath the badge. */
  description?: string
  className?: string
}

export function SummaryCard({ label, value, icon, badge, description, className }: SummaryCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm',
        className
      )}
    >
      {/* Header row: label + icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {label}
        </span>
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-subtle text-brand">
            {icon}
          </span>
        )}
      </div>

      {/* Primary value */}
      <p className="text-2xl font-bold tabular-nums text-text-primary">{value}</p>

      {/* Badge + description */}
      {(badge || description) && (
        <div className="flex flex-col gap-1">
          {badge}
          {description && <span className="text-xs text-text-muted">{description}</span>}
        </div>
      )}
    </div>
  )
}
