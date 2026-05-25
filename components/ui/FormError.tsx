/**
 * FormError — displays a form-level (non-field) error message.
 *
 * Used for server errors that are not tied to a specific field,
 * such as "Invalid credentials" or "Username already taken".
 *
 * Returns null when `message` is falsy — safe to always render.
 */

import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface FormErrorProps {
  message?: string | null
  className?: string
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5',
        'text-sm text-red-700',
        'dark:border-red-900 dark:bg-red-950/40 dark:text-red-400',
        className
      )}
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
