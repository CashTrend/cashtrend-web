'use client'

/**
 * Ticker detail page — shows full info for a single ticker with 5 tabs:
 *   Ratios | History | Income | Balance | Cashflow
 *
 * Data loading strategy:
 *   - Detail + Ratios: fetched on mount (needed for header + Ratios tab)
 *   - Income / Balance / Cashflow: fetched in parallel with detail on mount
 *   - History: lazy — HistoryTab handles its own fetching + pagination
 *
 * Header shows: symbol, name, sector, industry, description (truncatable).
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { TrendingUp, AlertCircle } from 'lucide-react'
import {
  getTickerDetail,
  getTickerIncome,
  getTickerBalance,
  getTickerCashflow,
} from '@/services/tickers.service'
import { RatiosTab } from '@/components/tickers/RatiosTab'
import { HistoryTab } from '@/components/tickers/HistoryTab'
import { FinancialsTab, type FinancialColumn } from '@/components/tickers/FinancialsTab'
import { cn } from '@/lib/utils'
import type {
  TickerDetail,
  TickerIncome,
  TickerBalance,
  TickerCashFlow,
} from '@/lib/types'

// ── Tab definition ─────────────────────────────────────────────────────────────

type TabId = 'ratios' | 'history' | 'income' | 'balance' | 'cashflow'

const TABS: { id: TabId; label: string }[] = [
  { id: 'ratios', label: 'Ratios' },
  { id: 'history', label: 'History' },
  { id: 'income', label: 'Income' },
  { id: 'balance', label: 'Balance' },
  { id: 'cashflow', label: 'Cash Flow' },
]

// ── Column definitions for FinancialsTab ──────────────────────────────────────

const INCOME_COLUMNS: FinancialColumn<TickerIncome>[] = [
  { label: 'Revenue', key: 'total_profit' },
  { label: 'Gross Profit', key: 'gross_profit' },
  { label: 'Operating Profit', key: 'operating_profit' },
  { label: 'EBIT', key: 'ebit' },
  { label: 'EBITDA', key: 'ebitda' },
  { label: 'Net Profit', key: 'net_profit' },
]

const BALANCE_COLUMNS: FinancialColumn<TickerBalance>[] = [
  { label: 'Current Assets', key: 'current_assets' },
  { label: 'Non-Current Assets', key: 'no_current_assets' },
  { label: 'Current Liabilities', key: 'current_liabilities' },
  { label: 'Non-Current Liabilities', key: 'no_current_liabilities' },
  { label: 'Net Equity', key: 'equity_net' },
]

const CASHFLOW_COLUMNS: FinancialColumn<TickerCashFlow>[] = [
  { label: 'Operating', key: 'operating_cash_flow' },
  { label: 'Investing', key: 'investing_cash_flow' },
  { label: 'Financing', key: 'financing_cash_flow' },
]

// ── Page data shape ────────────────────────────────────────────────────────────

interface PageData {
  detail: TickerDetail
  income: TickerIncome[]
  balance: TickerBalance[]
  cashflow: TickerCashFlow[]
}

async function loadAll(
  symbol: string,
  setData: (d: PageData) => void,
  setError: (e: string) => void,
  setLoading: (l: boolean) => void
) {
  setLoading(true)
  setError('')
  try {
    const [detail, income, balance, cashflow] = await Promise.all([
      getTickerDetail(symbol),
      getTickerIncome(symbol),
      getTickerBalance(symbol),
      getTickerCashflow(symbol),
    ])
    setData({ detail, income, balance, cashflow })
  } catch {
    setError('Could not load ticker data. Make sure the backend is running.')
  } finally {
    setLoading(false)
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function TickerDetailPage() {
  const params = useParams()
  const symbol = (params.symbol as string).toUpperCase()

  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('ratios')

  const setDataRef = useRef(setPageData)
  const setErrorRef = useRef(setError)
  const setLoadingRef = useRef(setLoading)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let next = index
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      next = (index + 1) % TABS.length
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      next = (index - 1 + TABS.length) % TABS.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      next = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      next = TABS.length - 1
    } else {
      return
    }
    setActiveTab(TABS[next].id)
    tabRefs.current[next]?.focus()
  }, [])

  useEffect(() => {
    loadAll(symbol, setDataRef.current, setErrorRef.current, setLoadingRef.current)
  }, [symbol])

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse" aria-busy="true">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-surface" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-32 rounded bg-surface" />
            <div className="h-4 w-64 rounded bg-surface" />
          </div>
        </div>
        <div className="flex gap-2">
          {TABS.map((t) => <div key={t.id} className="h-9 w-20 rounded-lg bg-surface" />)}
        </div>
        <div className="h-96 rounded-xl bg-surface" />
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <AlertCircle size={36} className="text-loss" aria-hidden="true" />
        <p className="text-sm text-text-secondary">{error}</p>
      </div>
    )
  }

  if (!pageData) return null

  const { detail, income, balance, cashflow } = pageData

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand">
          <TrendingUp size={20} aria-hidden="true" />
        </span>

        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="text-xl font-bold text-text-primary">{detail.symbol}</h1>
            <span className="text-sm text-text-secondary">{detail.name}</span>
          </div>

          {(detail.sector || detail.industry) && (
            <p className="text-xs text-text-muted">
              {[detail.sector, detail.industry].filter(Boolean).join(' · ')}
            </p>
          )}

          {detail.description && (
            <p className="mt-1 line-clamp-2 max-w-2xl text-xs text-text-secondary">
              {detail.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div
        role="tablist"
        aria-label="Ticker information tabs"
        className="flex flex-wrap gap-1 border-b border-border pb-0"
      >
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[i] = el }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleTabKeyDown(e, i)}
            className={cn(
              'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-brand text-brand'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab panels ── */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'ratios' && <RatiosTab ratios={detail.tickerratios_set} />}
        {activeTab === 'history' && <HistoryTab symbol={symbol} />}
        {activeTab === 'income' && (
          <FinancialsTab
            title="Income Statement"
            rows={income}
            columns={INCOME_COLUMNS}
            emptyMessage="No income statement data available."
          />
        )}
        {activeTab === 'balance' && (
          <FinancialsTab
            title="Balance Sheet"
            rows={balance}
            columns={BALANCE_COLUMNS}
            emptyMessage="No balance sheet data available."
          />
        )}
        {activeTab === 'cashflow' && (
          <FinancialsTab
            title="Cash Flow Statement"
            rows={cashflow}
            columns={CASHFLOW_COLUMNS}
            emptyMessage="No cash flow data available."
          />
        )}
      </div>
    </div>
  )
}
