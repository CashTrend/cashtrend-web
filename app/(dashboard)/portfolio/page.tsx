'use client'

/**
 * Portfolio page — transaction list with type + ticker filters.
 *
 * Data flow:
 *   1. On mount (after auth hydration), fetches all transactions via getTransactions()
 *   2. Filtering is client-side (no re-fetch on filter change) for snappy UX
 *   3. Delete calls deleteTransaction() then removes the item from local state
 *
 * A "New transaction" button links to /portfolio/new.
 */

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Plus, RefreshCw, AlertCircle } from 'lucide-react'
import { getTransactions, deleteTransaction } from '@/services/portfolio.service'
import { useAuth } from '@/context/auth-context'
import { useLocale } from '@/context/locale-context'
import { TransactionFilters, type FilterType } from '@/components/portfolio/TransactionFilters'
import { TransactionList } from '@/components/portfolio/TransactionList'
import type { Transaction } from '@/lib/types'
// ── helpers to avoid setState-in-effect lint rule ──────────────────────────────

async function loadTransactions(
  setTransactions: (t: Transaction[]) => void,
  setError: (e: string | null) => void,
  setLoading: (l: boolean) => void
) {
  setLoading(true)
  setError(null)
  try {
    const data = await getTransactions()
    setTransactions(data)
  } catch {
    setError('error')
  } finally {
    setLoading(false)
  }
}

export default function PortfolioPage() {
  const { isLoading: authLoading } = useAuth()
  const { t } = useLocale()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // Filters (client-side only)
  const [typeFilter, setTypeFilter] = useState<FilterType>('ALL')
  const [tickerFilter, setTickerFilter] = useState('')

  // Stable refs for the loader
  const setTransactionsRef = useRef(setTransactions)
  const setErrorRef = useRef(setError)
  const setLoadingRef = useRef(setLoading)

  const handleRetry = () =>
    loadTransactions(setTransactionsRef.current, setErrorRef.current, setLoadingRef.current)

  useEffect(() => {
    if (authLoading) return
    loadTransactions(setTransactionsRef.current, setErrorRef.current, setLoadingRef.current)
  }, [authLoading])

  // ── Delete ──
  function handleDelete(id: number) {
    setConfirmDeleteId(id)
    setDeleteError(null)
  }

  async function confirmDelete() {
    if (confirmDeleteId === null) return
    const id = confirmDeleteId
    setConfirmDeleteId(null)
    setDeletingId(id)
    setDeleteError(null)
    try {
      await deleteTransaction(id)
      setTransactions((prev) => prev.filter((tx) => tx.id !== id))
    } catch {
      setDeleteError(t.portfolio.error_delete)
    } finally {
      setDeletingId(null)
    }
  }

  // ── Client-side filtering ──
  const filtered = transactions.filter((tx) => {
    if (typeFilter !== 'ALL' && tx.transaction_type !== typeFilter) return false
    if (tickerFilter && !tx.ticker?.symbol.includes(tickerFilter)) return false
    return true
  })

  // ── Loading ──
  if (loading || authLoading) {
    return <PortfolioSkeleton />
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertCircle size={36} className="text-loss" aria-hidden="true" />
        <p className="text-sm font-medium text-text-primary">
          {t.portfolio.error_load} {t.ui.error_backend}
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

  return (
    <div className="flex flex-col gap-5">
      {/* Inline delete confirmation */}
      {confirmDeleteId !== null && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
            <h2
              id="delete-confirm-title"
              className="mb-2 text-base font-semibold text-text-primary"
            >
              {t.portfolio.delete_confirm_title}
            </h2>
            <p className="mb-5 text-sm text-text-secondary">{t.portfolio.delete_confirm_body}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-raised"
              >
                {t.ui.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-loss px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
              >
                {t.portfolio.delete_button}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete error banner */}
      {deleteError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-loss-border bg-loss-bg px-4 py-3 text-sm text-loss"
        >
          <AlertCircle size={14} aria-hidden="true" />
          {deleteError}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-text-muted">
          {transactions.length}{' '}
          {transactions.length !== 1
            ? t.portfolio.transaction_plural
            : t.portfolio.transaction_singular}
          {filtered.length !== transactions.length &&
            ` · ${filtered.length} ${t.portfolio.shown_suffix}`}
        </p>
        <Link
          href="/portfolio/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <Plus size={15} aria-hidden="true" />
          {t.portfolio.new_transaction}
        </Link>
      </div>

      {/* Filters */}
      <TransactionFilters
        type={typeFilter}
        ticker={tickerFilter}
        onTypeChange={setTypeFilter}
        onTickerChange={setTickerFilter}
      />

      {/* List */}
      <TransactionList transactions={filtered} onDelete={handleDelete} isDeleting={deletingId} />
    </div>
  )
}

function PortfolioSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-surface" />
        <div className="h-8 w-36 rounded-lg bg-surface" />
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-16 rounded-lg bg-surface" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-surface" />
    </div>
  )
}
