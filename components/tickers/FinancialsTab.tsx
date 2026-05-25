/**
 * FinancialsTab — generic table component for Income / Balance / Cashflow statements.
 *
 * Instead of three near-identical components, this one accepts a column
 * definition array so the parent can pass the right columns for each statement type.
 *
 * All values are nullable decimal strings → formatted with formatCompactCurrency().
 * Dates use formatDate().
 *
 * Usage:
 *   <FinancialsTab
 *     title="Income Statement"
 *     rows={incomeData}
 *     columns={INCOME_COLUMNS}
 *   />
 */

import { formatCompactCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

/** Column definition for a financial statement table. */
export interface FinancialColumn<T> {
  label: string
  /** Key of the row object to render. */
  key: keyof T
  /** Formatter override — defaults to formatCompactCurrency. */
  format?: (value: string | null | undefined) => string
}

interface FinancialsTabProps<T extends { id: number; date: string }> {
  title: string
  rows: T[]
  columns: FinancialColumn<T>[]
  /** Shown when rows is empty. */
  emptyMessage?: string
}

const TH = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary'
const TD = 'px-4 py-3 text-sm tabular-nums text-text-primary'

export function FinancialsTab<T extends { id: number; date: string }>({
  title,
  rows,
  columns,
  emptyMessage = 'No data available.',
}: FinancialsTabProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">{emptyMessage}</p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse" aria-label={title}>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              <th className={TH}>Year</th>
              {columns.map((col) => (
                <th key={String(col.key)} className={cn(TH, 'text-right')}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border transition-colors last:border-0 hover:bg-surface-raised"
              >
                <td className={cn(TD, 'font-medium text-text-secondary')}>
                  {formatDate(row.date, { year: 'numeric', timeZone: 'UTC' })}
                </td>
                {columns.map((col) => {
                  const raw = row[col.key] as string | null | undefined
                  const formatted = col.format ? col.format(raw) : formatCompactCurrency(raw)
                  return (
                    <td key={String(col.key)} className={cn(TD, 'text-right')}>
                      {formatted}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
