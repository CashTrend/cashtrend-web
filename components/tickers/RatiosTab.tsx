'use client'

/**
 * RatiosTab — grid of financial ratios for a ticker.
 *
 * Groups ratios into logical sections:
 *   Valuation  | Profitability | Cash Flow | Dividends
 *
 * Each ratio label includes a FieldTooltip with a glossary entry.
 * All values are nullable strings from the API — rendered as '—' when null.
 */

import { formatNumber, formatPercent, formatCompactCurrency, formatDate } from '@/lib/utils'
import { FieldTooltip } from '@/components/ui/FieldTooltip'
import { useLocale } from '@/context/locale-context'
import type { TickerRatios } from '@/lib/types'
import type { GlossaryEntry } from '@/lib/i18n/types'

interface RatiosTabProps {
  ratios: TickerRatios | null | undefined
}

interface RatioItem {
  label: string
  value: string
  glossaryEntry?: GlossaryEntry
}

interface RatioSection {
  title: string
  items: RatioItem[]
}

export function RatiosTab({ ratios }: RatiosTabProps) {
  const { t } = useLocale()
  const g = t.glossary.ratios

  if (!ratios) {
    return <p className="py-12 text-center text-sm text-text-muted">{t.tickers.ratios.no_data}</p>
  }

  const sections: RatioSection[] = [
    {
      title: t.tickers.ratios.section_valuation,
      items: [
        { label: t.tickers.ratios.beta, value: formatNumber(ratios.beta), glossaryEntry: g.beta },
        {
          label: t.tickers.ratios.pe_trailing,
          value: formatNumber(ratios.pe_ratio_past),
          glossaryEntry: g.pe_trailing,
        },
        {
          label: t.tickers.ratios.pe_forward,
          value: formatNumber(ratios.pe_ratio_forward),
          glossaryEntry: g.pe_forward,
        },
        {
          label: t.tickers.ratios.eps_trailing,
          value: formatNumber(ratios.eps_past),
          glossaryEntry: g.eps_trailing,
        },
        {
          label: t.tickers.ratios.eps_forward,
          value: formatNumber(ratios.eps_forward),
          glossaryEntry: g.eps_forward,
        },
        {
          label: t.tickers.ratios.peg,
          value: formatNumber(ratios.peg_ratio),
          glossaryEntry: g.peg,
        },
        { label: t.tickers.ratios.ps, value: formatNumber(ratios.ps_ratio), glossaryEntry: g.ps },
        { label: t.tickers.ratios.pb, value: formatNumber(ratios.pb_ratio), glossaryEntry: g.pb },
        {
          label: t.tickers.ratios.ev_revenue,
          value: formatNumber(ratios.ev_income_ratio),
          glossaryEntry: g.ev_revenue,
        },
        {
          label: t.tickers.ratios.ev_ebitda,
          value: formatNumber(ratios.ev_ebitda_ratio),
          glossaryEntry: g.ev_ebitda,
        },
      ],
    },
    {
      title: t.tickers.ratios.section_profitability,
      items: [
        {
          label: t.tickers.ratios.gross_margin,
          value: formatPercent(ratios.gross_margin),
          glossaryEntry: g.gross_margin,
        },
        {
          label: t.tickers.ratios.operating_margin,
          value: formatPercent(ratios.operating_margin),
          glossaryEntry: g.operating_margin,
        },
        {
          label: t.tickers.ratios.ebitda_margin,
          value: formatPercent(ratios.ebitda_margin),
          glossaryEntry: g.ebitda_margin,
        },
        {
          label: t.tickers.ratios.net_margin,
          value: formatPercent(ratios.net_profit_margin),
          glossaryEntry: g.net_margin,
        },
        {
          label: t.tickers.ratios.roa,
          value: formatPercent(ratios.roa_ratio),
          glossaryEntry: g.roa,
        },
        {
          label: t.tickers.ratios.roe,
          value: formatPercent(ratios.roe_ratio),
          glossaryEntry: g.roe,
        },
        {
          label: t.tickers.ratios.leverage,
          value: formatNumber(ratios.leverage_ratio),
          glossaryEntry: g.leverage,
        },
      ],
    },
    {
      title: t.tickers.ratios.section_cashflow,
      items: [
        {
          label: t.tickers.ratios.op_cashflow,
          value: formatCompactCurrency(ratios.operating_cash_flow),
          glossaryEntry: g.op_cashflow,
        },
        {
          label: t.tickers.ratios.free_cashflow,
          value: formatCompactCurrency(ratios.free_cash_flow),
          glossaryEntry: g.free_cashflow,
        },
      ],
    },
    {
      title: t.tickers.ratios.section_dividends,
      items: [
        {
          label: t.tickers.ratios.dividend_yield,
          value: formatPercent(ratios.dividend_yield),
          glossaryEntry: g.dividend_yield,
        },
        {
          label: t.tickers.ratios.dividend_date,
          value: formatDate(ratios.dividend_date),
          glossaryEntry: g.dividend_date,
        },
        {
          label: t.tickers.ratios.ex_dividend_date,
          value: formatDate(ratios.ex_dividend_date),
          glossaryEntry: g.ex_dividend_date,
        },
      ],
    },
  ]

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
              <div key={item.label} className="flex items-start justify-between gap-4">
                <dt className="flex items-center gap-1 text-sm text-text-secondary">
                  {item.label}
                  {item.glossaryEntry && <FieldTooltip entry={item.glossaryEntry} />}
                </dt>
                <dd className="text-sm font-medium tabular-nums text-text-primary">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}
