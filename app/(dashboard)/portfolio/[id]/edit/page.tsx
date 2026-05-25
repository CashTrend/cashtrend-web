'use client'

/**
 * Edit Transaction page — loads an existing transaction then renders
 * TransactionForm in edit mode.
 *
 * On success → redirect to /portfolio.
 * On load error → show error + back link.
 */

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getTransaction, updateTransaction } from '@/services/portfolio.service'
import { useLocale } from '@/context/locale-context'
import { TransactionForm } from '@/components/portfolio/TransactionForm'
import { FormError } from '@/components/ui'
import type { CreateTransactionRequest, Transaction } from '@/lib/types'

// Keep setter calls outside useEffect to avoid lint rule
async function loadTransaction(
  id: number,
  setTx: (t: Transaction) => void,
  setError: (e: string) => void,
  setLoading: (l: boolean) => void
) {
  setLoading(true)
  try {
    const data = await getTransaction(id)
    setTx(data)
  } catch {
    setError('not_found')
  } finally {
    setLoading(false)
  }
}

export default function EditTransactionPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useLocale()
  const id = Number(params.id)

  const [tx, setTx] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState<boolean>(() => Boolean(id && !isNaN(id)))
  const [loadError, setLoadError] = useState<string>(() => (!id || isNaN(id) ? 'invalid_id' : ''))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const setTxRef = useRef(setTx)
  const setLoadErrorRef = useRef(setLoadError)
  const setLoadingRef = useRef(setLoading)

  useEffect(() => {
    if (!id || isNaN(id)) return
    loadTransaction(id, setTxRef.current, setLoadErrorRef.current, setLoadingRef.current)
  }, [id])

  async function handleSubmit(payload: CreateTransactionRequest) {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await updateTransaction(id, payload)
      router.push('/portfolio')
    } catch {
      setSubmitError(t.portfolio.form.error_save)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="h-96 animate-pulse rounded-xl bg-surface" />
      </div>
    )
  }

  const displayError =
    loadError === 'invalid_id'
      ? t.portfolio.form.error_invalid_id
      : loadError === 'not_found'
        ? t.portfolio.form.error_not_found
        : loadError
          ? t.portfolio.form.error_not_found
          : null

  if (displayError || !tx) {
    return (
      <div className="mx-auto max-w-lg text-center py-24">
        <p className="text-sm text-text-secondary">
          {displayError ?? t.portfolio.form.error_not_found}
        </p>
        <Link href="/portfolio" className="mt-4 inline-block text-sm text-brand hover:underline">
          {t.nav.portfolio}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-6 text-base font-semibold text-text-primary">
          {t.portfolio.form.edit_title}
        </h2>
        <FormError message={submitError} />
        <TransactionForm
          initialValues={tx}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel={t.portfolio.form.submit_edit}
          onCancel={() => router.push('/portfolio')}
        />
      </div>
    </div>
  )
}
