/**
 * Input — styled text input field.
 *
 * Extends the native <input> element with consistent theming.
 * Shows an error ring + message when `error` is provided.
 * Optionally renders a left icon inside the input.
 */

import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Validation error message — displayed below the input and triggers red ring. */
  error?: string
  /** Icon rendered inside the input on the left side. */
  leftIcon?: React.ReactNode
}

export function Input({ error, leftIcon, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 flex items-center text-text-muted">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          className={cn(
            'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary',
            'placeholder:text-text-muted',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
              : 'border-border focus:border-brand focus:ring-brand',
            leftIcon && 'pl-10',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error && id ? `${id}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={id ? `${id}-error` : undefined} className="text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
