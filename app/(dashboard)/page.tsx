'use client'

/**
 * Dashboard page — portfolio overview.
 *
 * Fetches the portfolio summary from the backend after the AuthProvider
 * has hydrated the in-memory access token. The fetch is intentionally
 * client-side because the access token lives in memory only (not in
 * cookies accessible to Server Components).
 *
 * States:
 *   loading  → skeleton (handled by loading.tsx for initial SSR, then inline)
 *   error    → error card with retry button
 *   empty    → no positions yet, prompt to add a transaction
 *   data     → KPI cards + holdings table
 */

import { useEffect, useState, useRef } from 'react'
import { BarChart2, TrendingUp, DollarSign, RefreshCw, AlertCircle } from 'lucide-react'
import { getSummary } from '@/services/portfolio.service'
import { useAuth } from '@/context/auth-context'
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
  setSummary: (s: PortfolioSummary) => void,
  setError: (e: string | null) => void,
  setLoading: (l: boolean) => void
) {
  setLoading(true)
  setError(null)
  try {
    const data = await getSummary()
    setSummary(data)
  } catch {
    setError('Could not load portfolio data. Make sure the backend is running.')
  } finally {
    setLoading(false)
  }
}

export default function DashboardPage() {
  const { isLoading: authLoading } = useAuth()
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stable refs to setters — avoids re-running the effect when state changes
  const setSummaryRef = useRef(setSummary)
  const setErrorRef = useRef(setError)
  const setLoadingRef = useRef(setLoading)

  // Exposed retry handler for the error state button
  const handleRetry = () => loadSummary(setSummaryRef.current, setErrorRef.current, setLoadingRef.current)

  // Wait for auth hydration before fetching (token must be in memory first)
  useEffect(() => {
    if (authLoading) return
    loadSummary(setSummaryRef.current, setErrorRef.current, setLoadingRef.current)
  }, [authLoading])

  // ── Loading state ──
  if (loading || authLoading) {
    return <DashboardSkeleton />
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertCircle size={36} className="text-loss" aria-hidden="true" />
        <p className="text-sm font-medium text-text-primary">{error}</p>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Retry
        </button>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="flex flex-col gap-6">
      {/* ── KPI row ── */}
      <section aria-label="Portfolio summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Portfolio Value"
            value={formatCurrency(summary.total_current_value)}
            icon={<BarChart2 size={14} aria-hidden="true" />}
            badge={
              <PnLBadge
                amount={summary.total_pnl_amount}
                percent={summary.total_pnl_percent}
                size="sm"
              />
            }
            description="Market value of open positions"
          />

          <SummaryCard
            label="Total Invested"
            value={formatCurrency(summary.total_invested)}
            icon={<DollarSign size={14} aria-hidden="true" />}
            description="Capital deployed in open positions"
          />

          <SummaryCard
            label="Unrealised P&L"
            value={formatCurrency(summary.total_pnl_amount)}
            icon={<TrendingUp size={14} aria-hidden="true" />}
            badge={
              summary.total_pnl_percent != null ? (
                <PnLBadge percent={summary.total_pnl_percent} size="sm" />
              ) : undefined
            }
            description="Current value − total invested"
          />

          <LiquidityCard liquidity={summary.total_liquidity} />
        </div>
      </section>

      {/* ── Holdings table ── */}
      <section aria-label="Holdings">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Open Positions</h2>
          <span className="text-xs text-text-muted">
            {summary.holdings.length} holding{summary.holdings.length !== 1 ? 's' : ''}
          </span>
        </div>
        <HoldingsTable holdings={summary.holdings} />
      </section>
    </div>
  )
}

/** Inline skeleton shown while data is loading. */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
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
