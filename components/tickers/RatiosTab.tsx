/**
 * RatiosTab — grid of financial ratios for a ticker.
 *
 * Groups ratios into logical sections:
 *   Valuation  | Profitability | Cash Flow | Dividends
 *
 * All values are nullable strings from the API — rendered as '—' when null.
 * Percentage values (margins, yields) are formatted with formatPercent().
 * Ratio values (PE, PB, etc.) are formatted as plain numbers.
 * Large cash-flow values use formatCompactCurrency().
 *
 * Usage:
 *   <RatiosTab ratios={detail.tickerratios_set} />
 */

import { formatNumber, formatPercent, formatCompactCurrency, formatDate } from '@/lib/utils'
import type { TickerRatios } from '@/lib/types'

interface RatiosTabProps {
  ratios: TickerRatios | null | undefined
}

interface RatioItem {
  label: string
  value: string
}

interface RatioSection {
  title: string
  items: RatioItem[]
}

function buildSections(r: TickerRatios): RatioSection[] {
  return [
    {
      title: 'Valuation',
      items: [
        { label: 'Beta', value: formatNumber(r.beta) },
        { label: 'P/E (Trailing)', value: formatNumber(r.pe_ratio_past) },
        { label: 'P/E (Forward)', value: formatNumber(r.pe_ratio_forward) },
        { label: 'EPS (Trailing)', value: formatNumber(r.eps_past) },
        { label: 'EPS (Forward)', value: formatNumber(r.eps_forward) },
        { label: 'PEG Ratio', value: formatNumber(r.peg_ratio) },
        { label: 'P/S Ratio', value: formatNumber(r.ps_ratio) },
        { label: 'P/B Ratio', value: formatNumber(r.pb_ratio) },
        { label: 'EV / Revenue', value: formatNumber(r.ev_income_ratio) },
        { label: 'EV / EBITDA', value: formatNumber(r.ev_ebitda_ratio) },
      ],
    },
    {
      title: 'Profitability',
      items: [
        { label: 'Gross Margin', value: formatPercent(r.gross_margin) },
        { label: 'Operating Margin', value: formatPercent(r.operating_margin) },
        { label: 'EBITDA Margin', value: formatPercent(r.ebitda_margin) },
        { label: 'Net Profit Margin', value: formatPercent(r.net_profit_margin) },
        { label: 'ROA', value: formatPercent(r.roa_ratio) },
        { label: 'ROE', value: formatPercent(r.roe_ratio) },
        { label: 'Leverage Ratio', value: formatNumber(r.leverage_ratio) },
      ],
    },
    {
      title: 'Cash Flow',
      items: [
        { label: 'Operating Cash Flow', value: formatCompactCurrency(r.operating_cash_flow) },
        { label: 'Free Cash Flow', value: formatCompactCurrency(r.free_cash_flow) },
      ],
    },
    {
      title: 'Dividends',
      items: [
        { label: 'Dividend Yield', value: formatPercent(r.dividend_yield) },
        { label: 'Dividend Date', value: formatDate(r.dividend_date) },
        { label: 'Ex-Dividend Date', value: formatDate(r.ex_dividend_date) },
      ],
    },
  ]
}

export function RatiosTab({ ratios }: RatiosTabProps) {
  if (!ratios) {
    return <p className="py-12 text-center text-sm text-text-muted">No ratio data available.</p>
  }
  const sections = buildSections(ratios)

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {sections.map((section) => (
        <div
          key={section.title}
          className="rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {section.title}
          </h3>
          <dl className="flex flex-col gap-2">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <dt className="text-sm text-text-secondary">{item.label}</dt>
                <dd className="text-sm font-medium tabular-nums text-text-primary">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}
