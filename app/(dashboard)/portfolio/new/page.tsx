'use client'

/**
 * New Transaction page — wraps TransactionForm for creation mode.
 * On success, redirects back to /portfolio.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTransaction } from '@/services/portfolio.service'
import { TransactionForm } from '@/components/portfolio/TransactionForm'
import { FormError } from '@/components/ui'
import type { CreateTransactionRequest } from '@/lib/types'

export default function NewTransactionPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(payload: CreateTransactionRequest) {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await createTransaction(payload)
      router.push('/portfolio')
    } catch {
      setSubmitError('Failed to create transaction. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-6 text-base font-semibold text-text-primary">New Transaction</h2>
        <FormError message={submitError} />
        <TransactionForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Create transaction"
          onCancel={() => router.push('/portfolio')}
        />
      </div>
    </div>
  )
}
