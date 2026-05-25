'use client'

/**
 * TransactionForm — create or edit a transaction.
 *
 * Renders two distinct field sets based on the selected transaction_type:
 *
 *   BUY / SELL   → Ticker (autocomplete) + Quantity + Price per unit + Date + Notes
 *   INCOME / EXPENSE → Amount + Date + Notes
 *
 * The type selector always stays visible and switching it resets type-specific
 * fields (ticker/qty/price for BUY/SELL; amount for INCOME/EXPENSE).
 *
 * Props:
 *   initialValues  — pre-filled for edit mode (omit for create)
 *   onSubmit       — called with the validated payload; parent handles the API call
 *   isSubmitting   — disables the form while the parent awaits the API response
 *   submitLabel    — button label (default: "Save")
 *
 * Validation:
 *   BUY/SELL  : ticker required, quantity > 0, price_per_unit > 0, date required
 *   INCOME/EXPENSE: amount > 0, date required
 */

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FormError } from '@/components/ui/FormError'
import { TickerAutocomplete } from './TickerAutocomplete'
import { useLocale } from '@/context/locale-context'
import { cn } from '@/lib/utils'
import type { CreateTransactionRequest, Transaction, TransactionType } from '@/lib/types'

// ── Helpers ────────────────────────────────────────────────────────────────────

type TransactionMode = 'ticker' | 'cash'

function getMode(type: TransactionType): TransactionMode {
  return type === 'BUY' || type === 'SELL' ? 'ticker' : 'cash'
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface TransactionFormProps {
  /** Pre-filled values for edit mode. */
  initialValues?: Transaction
  onSubmit: (payload: CreateTransactionRequest) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
  /** Called when the cancel button is clicked. */
  onCancel?: () => void
}

// ── Component ──────────────────────────────────────────────────────────────────

export function TransactionForm({
  initialValues,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  onCancel,
}: TransactionFormProps) {
  const { t } = useLocale()

  // ── Zod schemas (built here to access translated messages) ──────────────────

  const positiveDecimal = z
    .string()
    .min(1, t.portfolio.form.validation.required)
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: t.portfolio.form.validation.positive,
    })

  const tickerSchema = z.object({
    transaction_type: z.enum(['BUY', 'SELL']),
    ticker: z.string().min(1, t.portfolio.form.validation.ticker_required),
    quantity: positiveDecimal,
    price_per_unit: positiveDecimal,
    date: z.string().min(1, t.portfolio.form.validation.required),
    notes: z.string().optional(),
  })

  const cashSchema = z.object({
    transaction_type: z.enum(['INCOME', 'EXPENSE']),
    amount: positiveDecimal,
    date: z.string().min(1, t.portfolio.form.validation.required),
    notes: z.string().optional(),
  })

  type TickerFormValues = z.infer<typeof tickerSchema>
  type CashFormValues = z.infer<typeof cashSchema>

  const initialType: TransactionType = initialValues?.transaction_type ?? 'BUY'
  const [txType, setTxType] = useState<TransactionType>(initialType)
  const [formError, setFormError] = useState<string | null>(null)

  const mode = getMode(txType)

  const TYPE_OPTIONS: { label: string; value: TransactionType }[] = [
    { label: t.portfolio.form.type_buy, value: 'BUY' },
    { label: t.portfolio.form.type_sell, value: 'SELL' },
    { label: t.portfolio.form.type_income, value: 'INCOME' },
    { label: t.portfolio.form.type_expense, value: 'EXPENSE' },
  ]

  // ── Ticker form (BUY/SELL) ──
  const tickerForm = useForm<TickerFormValues>({
    resolver: zodResolver(tickerSchema),
    defaultValues: {
      transaction_type: initialType === 'BUY' || initialType === 'SELL' ? initialType : 'BUY',
      ticker: initialValues?.ticker?.symbol ?? '',
      quantity: initialValues?.quantity ?? '',
      price_per_unit: initialValues?.price_per_unit ?? '',
      date: initialValues?.date ?? todayISO(),
      notes: initialValues?.notes ?? '',
    },
  })

  // ── Cash form (INCOME/EXPENSE) ──
  const cashForm = useForm<CashFormValues>({
    resolver: zodResolver(cashSchema),
    defaultValues: {
      transaction_type:
        initialType === 'INCOME' || initialType === 'EXPENSE' ? initialType : 'INCOME',
      amount: initialValues?.amount ?? '',
      date: initialValues?.date ?? todayISO(),
      notes: initialValues?.notes ?? '',
    },
  })

  // ── Type switch ──
  function handleTypeChange(newType: TransactionType) {
    setTxType(newType)
    setFormError(null)
    if (getMode(newType) === 'ticker') {
      tickerForm.setValue('transaction_type', newType as 'BUY' | 'SELL')
      tickerForm.clearErrors()
    } else {
      cashForm.setValue('transaction_type', newType as 'INCOME' | 'EXPENSE')
      cashForm.clearErrors()
    }
  }

  // ── Submit ──
  async function handleTickerSubmit(values: TickerFormValues) {
    setFormError(null)
    try {
      await onSubmit(values as CreateTransactionRequest)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.portfolio.form.error_unexpected)
    }
  }

  async function handleCashSubmit(values: CashFormValues) {
    setFormError(null)
    try {
      await onSubmit(values as CreateTransactionRequest)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.portfolio.form.error_unexpected)
    }
  }

  // ── Type selector ──
  const typeSelector = (
    <div>
      <Label>{t.portfolio.form.type_label}</Label>
      <div
        role="group"
        aria-label={t.portfolio.form.type_aria}
        className="mt-1.5 flex flex-wrap gap-2"
      >
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleTypeChange(opt.value)}
            aria-pressed={txType === opt.value}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              txType === opt.value
                ? 'bg-brand text-white'
                : 'bg-surface-raised text-text-secondary hover:bg-border hover:text-text-primary'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )

  const resolvedSubmitLabel = submitLabel ?? t.portfolio.form.submit_create

  // ── Shared footer ──
  const footer = (
    <div className="flex items-center justify-end gap-3 pt-2">
      {onCancel && (
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          {t.portfolio.form.cancel}
        </Button>
      )}
      <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
        {resolvedSubmitLabel}
      </Button>
    </div>
  )

  // Must be called unconditionally at the top level (Rules of Hooks)
  const watchedTicker = useWatch({ control: tickerForm.control, name: 'ticker' })

  // ── Render: BUY / SELL ──
  if (mode === 'ticker') {
    const {
      register,
      formState: { errors },
      setValue,
    } = tickerForm
    return (
      <form
        onSubmit={tickerForm.handleSubmit(handleTickerSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        {typeSelector}
        <FormError message={formError} />

        {/* Ticker autocomplete */}
        <div>
          <Label required>{t.portfolio.form.ticker_label}</Label>
          <TickerAutocomplete
            value={watchedTicker}
            onSelect={(tk) => {
              setValue('ticker', tk.symbol, { shouldValidate: true })
            }}
            onClear={() => setValue('ticker', '', { shouldValidate: true })}
            error={errors.ticker?.message}
            className="mt-1.5"
          />
        </div>

        {/* Quantity + Price — side by side on sm+ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="quantity" required>
              {t.portfolio.form.quantity_label}
            </Label>
            <Input
              id="quantity"
              type="number"
              step="any"
              min="0"
              placeholder={t.portfolio.form.number_placeholder}
              {...register('quantity')}
              error={errors.quantity?.message}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="price_per_unit" required>
              {t.portfolio.form.price_label}
            </Label>
            <Input
              id="price_per_unit"
              type="number"
              step="any"
              min="0"
              placeholder={t.portfolio.form.number_placeholder}
              {...register('price_per_unit')}
              error={errors.price_per_unit?.message}
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <Label htmlFor="ticker-date" required>
            {t.portfolio.form.date_label}
          </Label>
          <Input
            id="ticker-date"
            type="date"
            {...register('date')}
            error={errors.date?.message}
            className="mt-1.5"
          />
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="ticker-notes">{t.portfolio.form.notes_label}</Label>
          <textarea
            id="ticker-notes"
            rows={2}
            placeholder={t.portfolio.form.notes_placeholder}
            {...register('notes')}
            className={cn(
              'mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm',
              'text-text-primary placeholder:text-text-muted outline-none transition-colors',
              'focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none'
            )}
          />
        </div>

        {footer}
      </form>
    )
  }

  // ── Render: INCOME / EXPENSE ──
  const {
    register,
    formState: { errors },
  } = cashForm
  return (
    <form
      onSubmit={cashForm.handleSubmit(handleCashSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      {typeSelector}
      <FormError message={formError} />

      {/* Amount */}
      <div>
        <Label htmlFor="amount" required>
          {t.portfolio.form.amount_label}
        </Label>
        <Input
          id="amount"
          type="number"
          step="any"
          min="0"
          placeholder={t.portfolio.form.number_placeholder}
          {...register('amount')}
          error={errors.amount?.message}
          className="mt-1.5"
        />
      </div>

      {/* Date */}
      <div>
        <Label htmlFor="cash-date" required>
          {t.portfolio.form.date_label}
        </Label>
        <Input
          id="cash-date"
          type="date"
          {...register('date')}
          error={errors.date?.message}
          className="mt-1.5"
        />
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="cash-notes">{t.portfolio.form.notes_label}</Label>
        <textarea
          id="cash-notes"
          rows={2}
          placeholder={t.portfolio.form.notes_placeholder}
          {...register('notes')}
          className={cn(
            'mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm',
            'text-text-primary placeholder:text-text-muted outline-none transition-colors',
            'focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none'
          )}
        />
      </div>

      {footer}
    </form>
  )
}
