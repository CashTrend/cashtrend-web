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
  markAsCedear,
  unmarkAsCedear,
} from '@/services/tickers.service'
import { RatiosTab } from '@/components/tickers/RatiosTab'
import { HistoryTab } from '@/components/tickers/HistoryTab'
import { FinancialsTab, type FinancialColumn } from '@/components/tickers/FinancialsTab'
import { useLocale } from '@/context/locale-context'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import type { TickerDetail, TickerIncome, TickerBalance, TickerCashFlow } from '@/lib/types'

// ── Tab definition ─────────────────────────────────────────────────────────────

type TabId = 'ratios' | 'history' | 'income' | 'balance' | 'cashflow'

// ── Page data shape ────────────────────────────────────────────────────────────

interface PageData {
  detail: TickerDetail
  /** null = request failed or ticker has no income data (e.g. ETFs). Tab is hidden. */
  income: TickerIncome[] | null
  /** null = request failed or ticker has no balance sheet data. Tab is hidden. */
  balance: TickerBalance[] | null
  /** null = request failed or ticker has no cash flow data. Tab is hidden. */
  cashflow: TickerCashFlow[] | null
}

async function loadAll(
  symbol: string,
  errorMsg: string,
  setData: (d: PageData) => void,
  setError: (e: string) => void,
  setLoading: (l: boolean) => void
) {
  setLoading(true)
  setError('')
  try {
    const [detailResult, incomeResult, balanceResult, cashflowResult] = await Promise.allSettled([
      getTickerDetail(symbol),
      getTickerIncome(symbol),
      getTickerBalance(symbol),
      getTickerCashflow(symbol),
    ])

    // detail is mandatory — any failure here is a fatal page error
    if (detailResult.status === 'rejected') {
      setError(errorMsg)
      return
    }

    setData({
      detail: detailResult.value,
      // income/balance/cashflow are optional — null means not available for this ticker
      income: incomeResult.status === 'fulfilled' ? incomeResult.value : null,
      balance: balanceResult.status === 'fulfilled' ? balanceResult.value : null,
      cashflow: cashflowResult.status === 'fulfilled' ? cashflowResult.value : null,
    })
  } catch {
    setError(errorMsg)
  } finally {
    setLoading(false)
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function TickerDetailPage() {
  const params = useParams()
  const symbol = (params.symbol as string).toUpperCase()
  const { t } = useLocale()
  const { isLoading: authLoading } = useAuth()

  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('ratios')

  // ── CEDEAR marking ──────────────────────────────────────────────────────────
  const [cedearFormOpen, setCedearFormOpen] = useState(false)
  const [cedearRatio, setCedearRatio] = useState('')
  const [cedearLoading, setCedearLoading] = useState(false)
  const [cedearError, setCedearError] = useState('')
  const [unmarkLoading, setUnmarkLoading] = useState(false)
  const [unmarkError, setUnmarkError] = useState('')

  // ── Built inside component to access t ──
  const TABS: { id: TabId; label: string }[] = [
    { id: 'ratios', label: t.tickers.tabs.ratios },
    { id: 'history', label: t.tickers.tabs.history },
    { id: 'income', label: t.tickers.tabs.income },
    { id: 'balance', label: t.tickers.tabs.balance },
    { id: 'cashflow', label: t.tickers.tabs.cashflow },
  ]

  const INCOME_COLUMNS: FinancialColumn<TickerIncome>[] = [
    {
      label: t.tickers.income.col_revenue,
      key: 'total_profit',
      glossaryEntry: t.glossary.income.revenue,
    },
    {
      label: t.tickers.income.col_gross_profit,
      key: 'gross_profit',
      glossaryEntry: t.glossary.income.gross_profit,
    },
    {
      label: t.tickers.income.col_operating_profit,
      key: 'operating_profit',
      glossaryEntry: t.glossary.income.operating_profit,
    },
    { label: t.tickers.income.col_ebit, key: 'ebit', glossaryEntry: t.glossary.income.ebit },
    { label: t.tickers.income.col_ebitda, key: 'ebitda', glossaryEntry: t.glossary.income.ebitda },
    {
      label: t.tickers.income.col_net_profit,
      key: 'net_profit',
      glossaryEntry: t.glossary.income.net_profit,
    },
  ]

  const BALANCE_COLUMNS: FinancialColumn<TickerBalance>[] = [
    {
      label: t.tickers.balance.col_current_assets,
      key: 'current_assets',
      glossaryEntry: t.glossary.balance.current_assets,
    },
    {
      label: t.tickers.balance.col_noncurrent_assets,
      key: 'no_current_assets',
      glossaryEntry: t.glossary.balance.noncurrent_assets,
    },
    {
      label: t.tickers.balance.col_current_liabilities,
      key: 'current_liabilities',
      glossaryEntry: t.glossary.balance.current_liabilities,
    },
    {
      label: t.tickers.balance.col_noncurrent_liabilities,
      key: 'no_current_liabilities',
      glossaryEntry: t.glossary.balance.noncurrent_liabilities,
    },
    {
      label: t.tickers.balance.col_equity,
      key: 'equity_net',
      glossaryEntry: t.glossary.balance.equity,
    },
  ]

  const CASHFLOW_COLUMNS: FinancialColumn<TickerCashFlow>[] = [
    {
      label: t.tickers.cashflow.col_operating,
      key: 'operating_cash_flow',
      glossaryEntry: t.glossary.cashflow.operating,
    },
    {
      label: t.tickers.cashflow.col_investing,
      key: 'investing_cash_flow',
      glossaryEntry: t.glossary.cashflow.investing,
    },
    {
      label: t.tickers.cashflow.col_financing,
      key: 'financing_cash_flow',
      glossaryEntry: t.glossary.cashflow.financing,
    },
  ]

  const setDataRef = useRef(setPageData)
  const setErrorRef = useRef(setError)
  const setLoadingRef = useRef(setLoading)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // ── Mark ticker as CEDEAR ────────────────────────────────────────────────────
  async function handleMarkCedear(e: React.FormEvent) {
    e.preventDefault()
    const ratio = cedearRatio.trim()
    if (!ratio || isNaN(Number(ratio)) || Number(ratio) <= 0) {
      setCedearError('Ingresá un ratio de conversión positivo (ej. 10).')
      return
    }
    setCedearLoading(true)
    setCedearError('')
    try {
      const updated = await markAsCedear(symbol, ratio)
      setPageData((prev) =>
        prev
          ? {
              ...prev,
              detail: { ...prev.detail, ...updated, tickerratios_set: prev.detail.tickerratios_set },
            }
          : prev
      )
      setCedearFormOpen(false)
      setCedearRatio('')
    } catch {
      setCedearError('Error al guardar. Intentá de nuevo.')
    } finally {
      setCedearLoading(false)
    }
  }

  // ── Unmark ticker as CEDEAR ──────────────────────────────────────────────────
  async function handleUnmarkCedear() {
    setUnmarkLoading(true)
    setUnmarkError('')
    try {
      const updated = await unmarkAsCedear(symbol)
      setPageData((prev) =>
        prev
          ? {
              ...prev,
              detail: { ...prev.detail, ...updated, tickerratios_set: prev.detail.tickerratios_set },
            }
          : prev
      )
    } catch {
      setUnmarkError('Error al quitar CEDEAR.')
    } finally {
      setUnmarkLoading(false)
    }
  }

  // ── Visible tabs — hide Income/Balance/Cashflow when data is null ──
  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === 'income') return pageData?.income !== null
    if (tab.id === 'balance') return pageData?.balance !== null
    if (tab.id === 'cashflow') return pageData?.cashflow !== null
    return true
  })

  // ── Derive effective tab: fall back to 'ratios' if active tab is now hidden ──
  const effectiveTab = visibleTabs.some((tab) => tab.id === activeTab) ? activeTab : 'ratios'

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let next = index
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next = (index + 1) % visibleTabs.length
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        next = (index - 1 + visibleTabs.length) % visibleTabs.length
      } else if (e.key === 'Home') {
        e.preventDefault()
        next = 0
      } else if (e.key === 'End') {
        e.preventDefault()
        next = visibleTabs.length - 1
      } else {
        return
      }
      setActiveTab(visibleTabs[next].id)
      tabRefs.current[next]?.focus()
    },
    [visibleTabs]
  )

  useEffect(() => {
    if (authLoading) return
    loadAll(
      symbol,
      t.tickers.error_load,
      setDataRef.current,
      setErrorRef.current,
      setLoadingRef.current
    )
  }, [authLoading, symbol, t.tickers.error_load])

  // ── Loading ──
  if (loading || authLoading) {
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
          {TABS.map((t) => (
            <div key={t.id} className="h-9 w-20 rounded-lg bg-surface" />
          ))}
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
            {detail.is_cedear && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                CEDEAR
              </span>
            )}
          </div>

          {(detail.sector || detail.industry) && (
            <p className="text-xs text-text-muted">
              {[detail.sector, detail.industry].filter(Boolean).join(' · ')}
            </p>
          )}

          {detail.is_cedear && detail.conversion_ratio && (
            <p className="text-xs text-text-muted">
              Ratio de conversión:{' '}
              <span className="font-semibold text-text-secondary">{detail.conversion_ratio}:1</span>
              {' '}(cuántos CEDEAR = 1 acción subyacente)
            </p>
          )}

          {detail.description && (
            <p className="mt-1 line-clamp-2 max-w-2xl text-xs text-text-secondary">
              {detail.description}
            </p>
          )}

          {/* ── CEDEAR actions ── */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCedearFormOpen((open) => !open)
                setCedearError('')
                if (!cedearFormOpen && detail.conversion_ratio) {
                  setCedearRatio(detail.conversion_ratio)
                }
              }}
              className="text-xs text-brand underline-offset-2 hover:underline"
            >
              {detail.is_cedear ? 'Editar ratio CEDEAR' : 'Marcar como CEDEAR'}
            </button>

            {detail.is_cedear && (
              <button
                type="button"
                onClick={handleUnmarkCedear}
                disabled={unmarkLoading}
                className="text-xs text-loss underline-offset-2 hover:underline disabled:opacity-50"
              >
                {unmarkLoading ? 'Quitando…' : 'Quitar CEDEAR'}
              </button>
            )}

            {unmarkError && <p className="text-xs text-loss">{unmarkError}</p>}

            {cedearFormOpen && (
              <form
                onSubmit={handleMarkCedear}
                className="mt-2 flex w-full max-w-xs flex-col gap-2 rounded-lg border border-border bg-surface-raised p-3"
              >
                <label className="text-xs font-medium text-text-secondary">
                  Ratio de conversión
                  <span className="ml-1 font-normal text-text-muted">(N CEDEAR = 1 acción)</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={cedearRatio}
                  onChange={(e) => setCedearRatio(e.target.value)}
                  placeholder="ej. 10"
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                />
                {cedearError && <p className="text-xs text-loss">{cedearError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={cedearLoading}
                    className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
                  >
                    {cedearLoading ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCedearFormOpen(false)}
                    className="rounded-md px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div
        role="tablist"
        aria-label={t.tickers.tabs.aria}
        className="flex flex-wrap gap-1 border-b border-border pb-0"
      >
        {visibleTabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={effectiveTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={effectiveTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleTabKeyDown(e, i)}
            className={cn(
              'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
              effectiveTab === tab.id
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
        id={`tabpanel-${effectiveTab}`}
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`tab-${effectiveTab}`}
      >
        {effectiveTab === 'ratios' && <RatiosTab ratios={detail.tickerratios_set} />}
        {effectiveTab === 'history' && <HistoryTab symbol={symbol} />}
        {effectiveTab === 'income' && (
          <FinancialsTab
            title={t.tickers.income.title}
            rows={income ?? []}
            columns={INCOME_COLUMNS}
            emptyMessage={t.tickers.income.no_data}
          />
        )}
        {effectiveTab === 'balance' && (
          <FinancialsTab
            title={t.tickers.balance.title}
            rows={balance ?? []}
            columns={BALANCE_COLUMNS}
            emptyMessage={t.tickers.balance.no_data}
          />
        )}
        {effectiveTab === 'cashflow' && (
          <FinancialsTab
            title={t.tickers.cashflow.title}
            rows={cashflow ?? []}
            columns={CASHFLOW_COLUMNS}
            emptyMessage={t.tickers.cashflow.no_data}
          />
        )}
      </div>
    </div>
  )
}
