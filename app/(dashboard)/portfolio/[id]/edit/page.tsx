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
    setError('Transaction not found or could not be loaded.')
  } finally {
    setLoading(false)
  }
}

export default function EditTransactionPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const [tx, setTx] = useState<Transaction | null>(null)
  // Initialise loading/error from the id so we never call setState inside the effect body
  const [loading, setLoading] = useState<boolean>(() => Boolean(id && !isNaN(id)))
  const [loadError, setLoadError] = useState<string>(() =>
    !id || isNaN(id) ? 'Invalid transaction ID.' : ''
  )
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
      setSubmitError('Failed to save changes. Please try again.')
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

  if (loadError || !tx) {
    return (
      <div className="mx-auto max-w-lg text-center py-24">
        <p className="text-sm text-text-secondary">{loadError || 'Transaction not found.'}</p>
        <Link href="/portfolio" className="mt-4 inline-block text-sm text-brand hover:underline">
          Back to Portfolio
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-6 text-base font-semibold text-text-primary">Edit Transaction</h2>
        <FormError message={submitError} />
        <TransactionForm
          initialValues={tx}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Save changes"
          onCancel={() => router.push('/portfolio')}
        />
      </div>
    </div>
  )
}
