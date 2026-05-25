'use client'

/**
 * FinancialsTab — generic table component for Income / Balance / Cashflow statements.
 *
 * Column definitions accept an optional `glossaryEntry` which renders a
 * FieldTooltip next to the column header label.
 */

import { formatCompactCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { FieldTooltip } from '@/components/ui/FieldTooltip'
import type { GlossaryEntry } from '@/lib/i18n/types'

/** Column definition for a financial statement table. */
export interface FinancialColumn<T> {
  label: string
  /** Key of the row object to render. */
  key: keyof T
  /** Formatter override — defaults to formatCompactCurrency. */
  format?: (value: string | null | undefined) => string
  /** Optional glossary entry — renders a FieldTooltip in the column header. */
  glossaryEntry?: GlossaryEntry
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
    return <p className="py-12 text-center text-sm text-text-muted">{emptyMessage}</p>
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
                  <span className="inline-flex items-center justify-end gap-1">
                    {col.label}
                    {col.glossaryEntry && <FieldTooltip entry={col.glossaryEntry} />}
                  </span>
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
