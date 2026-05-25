/**
 * Utility functions — formatting, class merging, and common helpers.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import Decimal from 'decimal.js'

/**
 * Merge Tailwind CSS class names, resolving conflicts correctly.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'px-6')
 * // → 'py-2 bg-blue-500 px-6'  (px-4 overridden by px-6)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a decimal string or number as a currency string (USD by default).
 * Always use this instead of parseFloat for backend decimal values.
 *
 * @param value - Decimal value (string from API or number)
 * @param currency - ISO 4217 currency code (default: 'USD')
 * @param locale - BCP 47 locale tag (default: 'en-US')
 * @returns Formatted currency string, e.g. '$1,234.56' or '—' for null/undefined
 *
 * @example
 * formatCurrency('1234.56')  // → '$1,234.56'
 * formatCurrency(null)       // → '—'
 */
export function formatCurrency(
  value: string | number | null | undefined,
  currency = 'USD',
  locale = 'en-US'
): string {
  if (value === null || value === undefined || value === '') return '—'
  try {
    const num = new Decimal(value).toNumber()
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  } catch {
    return '—'
  }
}

/**
 * Format a decimal string as a percentage with a sign prefix.
 * Always use this instead of parseFloat for backend decimal values.
 *
 * @param value - Percentage value (e.g. '12.34' means 12.34%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string, e.g. '+12.34%' or '-3.21%' or '—' for null
 *
 * @example
 * formatPercent('12.34')   // → '+12.34%'
 * formatPercent('-3.21')   // → '-3.21%'
 * formatPercent(null)      // → '—'
 */
export function formatPercent(value: string | number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || value === '') return '—'
  try {
    const num = new Decimal(value).toNumber()
    const sign = num > 0 ? '+' : ''
    return `${sign}${num.toFixed(decimals)}%`
  } catch {
    return '—'
  }
}

/**
 * Format a decimal string as a compact number (e.g. billions/millions).
 * Useful for large financial statement values.
 *
 * @param value - Numeric value (string or number)
 * @param locale - BCP 47 locale tag (default: 'en-US')
 * @returns Compact formatted string, e.g. '$1.23B' or '—' for null
 *
 * @example
 * formatCompactCurrency('1234567890')  // → '$1.23B'
 * formatCompactCurrency('5000000')     // → '$5M'
 */
export function formatCompactCurrency(
  value: string | number | null | undefined,
  locale = 'en-US'
): string {
  if (value === null || value === undefined || value === '') return '—'
  try {
    const num = new Decimal(value).toNumber()
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(num)
  } catch {
    return '—'
  }
}

/**
 * Format a decimal string as a plain number with specified decimal places.
 * Useful for quantities and ratios.
 *
 * @param value - Numeric value (string or number)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string or '—' for null
 *
 * @example
 * formatNumber('1234567.89')  // → '1,234,567.89'
 * formatNumber('0.00034567', 6)  // → '0.000346'
 */
export function formatNumber(value: string | number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || value === '') return '—'
  try {
    const num = new Decimal(value).toNumber()
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num)
  } catch {
    return '—'
  }
}

/**
 * Format a date string (YYYY-MM-DD or ISO 8601) for display.
 *
 * @param value - Date string from the API
 * @param options - Intl.DateTimeFormatOptions (default: MMM DD, YYYY)
 * @returns Human-readable date string or '—' for null
 *
 * @example
 * formatDate('2024-01-15')  // → 'Jan 15, 2024'
 * formatDate(null)           // → '—'
 */
export function formatDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
  if (!value) return '—'
  try {
    // Parse as UTC to avoid timezone-offset day shifts on YYYY-MM-DD strings
    const date = new Date(`${value}T00:00:00Z`)
    if (isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(date)
  } catch {
    return '—'
  }
}

/**
 * Determine whether a P&L value is positive (gain), negative (loss), or neutral.
 * Useful for applying conditional color classes.
 *
 * @param value - Decimal string value
 * @returns 'gain' | 'loss' | 'neutral'
 */
export function getPnlDirection(
  value: string | number | null | undefined
): 'gain' | 'loss' | 'neutral' {
  if (value === null || value === undefined || value === '') return 'neutral'
  try {
    const num = new Decimal(value)
    if (num.isPositive() && !num.isZero()) return 'gain'
    if (num.isNegative()) return 'loss'
    return 'neutral'
  } catch {
    return 'neutral'
  }
}

/**
 * Return the appropriate Tailwind text color class for a P&L value.
 * Relies on CSS custom properties defined in globals.css.
 *
 * @param value - Decimal string value
 * @returns Tailwind class string
 */
export function pnlColorClass(value: string | number | null | undefined): string {
  const direction = getPnlDirection(value)
  if (direction === 'gain') return 'text-gain'
  if (direction === 'loss') return 'text-loss'
  return 'text-text-muted'
}
