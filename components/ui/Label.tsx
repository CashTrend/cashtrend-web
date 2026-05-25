/**
 * Label — accessible form label with optional required indicator.
 */

import { cn } from '@/lib/utils'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** When true, appends a red asterisk to indicate a required field. */
  required?: boolean
}

export function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <label className={cn('block text-sm font-medium text-text-primary', className)} {...props}>
      {children}
      {required && (
        <span className="ml-0.5 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
}
