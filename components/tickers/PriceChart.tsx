'use client'

/**
 * PriceChart — area chart of daily close prices using Recharts.
 *
 * Recharts components must be rendered client-side (they use browser APIs).
 * Data is passed in from HistoryTab — no fetching here.
 *
 * Visual choices:
 *   - Area chart with gradient fill (brand blue)
 *   - X axis: date labels, auto-skipped to avoid crowding
 *   - Y axis: compact currency format, auto-domain with 2% padding
 *   - Tooltip: formatted date + close price
 *   - Responsive container fills parent width, fixed height 260px
 *
 * Usage:
 *   <PriceChart entries={historyPage.results} />
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Decimal from 'decimal.js'
import { useId } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useLocale } from '@/context/locale-context'
import type { TickerHistoryEntry } from '@/lib/types'

interface PriceChartProps {
  entries: TickerHistoryEntry[]
}

interface ChartPoint {
  date: string
  close: number
}

/** Convert API history entries to chart-ready points (oldest → newest). */
function toChartData(entries: TickerHistoryEntry[]): ChartPoint[] {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .flatMap((e) => {
      try {
        return [{ date: e.date, close: new Decimal(e.close_price).toNumber() }]
      } catch {
        return []
      }
    })
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-text-primary">{formatDate(label)}</p>
      <p className="text-brand">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function PriceChart({ entries }: PriceChartProps) {
  const gradientId = useId()
  const { t } = useLocale()
  const data = toChartData(entries)

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-xl bg-surface-raised">
        <p className="text-sm text-text-muted">{t.tickers.history.no_data}</p>
      </div>
    )
  }

  return (
    <div className="h-[260px] w-full" role="img" aria-label={t.tickers.history.chart_aria}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={(d: string) =>
              new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              })
            }
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            tickFormatter={(v: number) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumFractionDigits: 2,
              }).format(v)
            }
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            width={60}
            domain={['auto', 'auto']}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="close"
            stroke="var(--brand)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--brand)', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
