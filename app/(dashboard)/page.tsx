'use client'

/**
 * Dashboard page — portfolio overview.
 *
 * Fetches the portfolio summary from the backend after the AuthProvider
 * has hydrated the in-memory access token. The fetch is intentionally
 * client-side because the access token lives in memory only (not in
 * cookies accessible to Server Components).
 *
 * Supports ?currency=ARS display: a toggle switches between USD and ARS
 * values for all portfolio figures. The ARS conversion is done server-side
 * using the latest USD/ARS FX rate.
 *
 * States:
 *   loading  → skeleton (handled by loading.tsx for initial SSR, then inline)
 *   error    → error card with retry button
 *   empty    → no positions yet, prompt to add a transaction
 *   data     → KPI cards + holdings table
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { BarChart2, TrendingUp, DollarSign, RefreshCw, AlertCircle } from 'lucide-react'
import { getSummary } from '@/services/portfolio.service'
import { useAuth } from '@/context/auth-context'
import { useLocale } from '@/context/locale-context'
import { SummaryCard } from '@/components/dashboard/SummaryCard'
import { LiquidityCard } from '@/components/dashboard/LiquidityCard'
import { HoldingsTable } from '@/components/dashboard/HoldingsTable'
import { PnLBadge } from '@/components/dashboard/PnLBadge'
import { formatCurrency } from '@/lib/utils'
import type { PortfolioSummary } from '@/lib/types'

/**
 * Fetch the portfolio summary and update the provided state setters.
 * Defined outside the component so it is never recreated on render and
 * does not appear as a setState-call-site inside a useEffect body.
 */
async function loadSummary(
  currency: string | undefined,
  setSummary: (s: PortfolioSummary) => void,
  setError: (e: string | null) => void,
  setLoading: (l: boolean) => void
) {
  setLoading(true)
  setError(null)
  try {
    const data = await getSummary(currency)
    setSummary(data)
  } catch {
    setError('error')
  } finally {
    setLoading(false)
  }
}

export default function DashboardPage() {
  const { isLoading: authLoading } = useAuth()
  const { t } = useLocale()
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(authLoading)
  const [error, setError] = useState<string | null>(null)
  const [showArs, setShowArs] = useState(false)

  const displayCurrency = showArs ? 'ARS' : undefined

  // Stable refs to setters — avoids re-running the effect when state changes
  const setSummaryRef = useRef(setSummary)
  const setErrorRef = useRef(setError)
  const setLoadingRef = useRef(setLoading)

  // Exposed retry handler for the error state button
  const handleRetry = useCallback(
    () => loadSummary(displayCurrency, setSummaryRef.current, setErrorRef.current, setLoadingRef.current),
    [displayCurrency]
  )

  // Wait for auth hydration before fetching (token must be in memory first)
  useEffect(() => {
    if (authLoading) return
    loadSummary(displayCurrency, setSummaryRef.current, setErrorRef.current, setLoadingRef.current)
  }, [authLoading, displayCurrency])

  // ── Loading state ──
  if (loading || authLoading) {
    return <DashboardSkeleton label={t.dashboard.loading} />
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertCircle size={36} className="text-loss" aria-hidden="true" />
        <p className="text-sm font-medium text-text-primary">
          {t.dashboard.error} {t.ui.error_backend}
        </p>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
        >
          <RefreshCw size={14} aria-hidden="true" />
          {t.ui.retry}
        </button>
      </div>
    )
  }

  if (!summary) return null

  const currencyCode = showArs ? 'ARS' : 'USD'

  return (
    <div className="flex flex-col gap-6">
      {/* ── KPI row ── */}
      <section aria-label={t.dashboard.portfolio_summary}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label={t.dashboard.portfolio_value}
            value={formatCurrency(summary.total_current_value, currencyCode)}
            icon={<BarChart2 size={14} aria-hidden="true" />}
            badge={
              <PnLBadge
                amount={summary.total_pnl_amount}
                percent={summary.total_pnl_percent}
                size="sm"
              />
            }
            description={t.dashboard.portfolio_value_desc}
          />

          <SummaryCard
            label={t.dashboard.total_invested}
            value={formatCurrency(summary.total_invested, currencyCode)}
            icon={<DollarSign size={14} aria-hidden="true" />}
            description={t.dashboard.total_invested_desc}
          />

          <SummaryCard
            label={t.dashboard.unrealised_pnl}
            value={formatCurrency(summary.total_pnl_amount, currencyCode)}
            icon={<TrendingUp size={14} aria-hidden="true" />}
            badge={
              summary.total_pnl_percent != null ? (
                <PnLBadge percent={summary.total_pnl_percent} size="sm" />
              ) : undefined
            }
            description={t.dashboard.unrealised_pnl_desc}
          />

          <LiquidityCard liquidity={summary.total_liquidity} currency={currencyCode} />
        </div>
      </section>

      {/* ── Holdings table ── */}
      <section aria-label={t.dashboard.open_positions}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text-primary">{t.dashboard.open_positions}</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowArs((prev) => !prev)}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-raised transition-colors"
            >
              {showArs ? t.dashboard.show_usd : t.dashboard.show_ars}
            </button>
            <span className="text-xs text-text-muted">
              {summary.holdings.length}{' '}
              {summary.holdings.length !== 1
                ? t.dashboard.holding_plural
                : t.dashboard.holding_singular}
            </span>
          </div>
        </div>
        <HoldingsTable holdings={summary.holdings} />
      </section>
    </div>
  )
}

/** Inline skeleton shown while data is loading. */
function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-6 animate-pulse" aria-busy="true" aria-label={label}>
      {/* KPI skeletons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-border-subtle" />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="h-64 rounded-xl bg-border-subtle" />
    </div>
  )
}
