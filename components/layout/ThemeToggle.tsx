'use client'

/**
 * ThemeToggle — toggles between light and dark mode.
 *
 * Uses next-themes under the hood. This component is loaded client-only from
 * the header, so it can render immediately without a mount guard.
 */

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/context/locale-context'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useLocale()

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t.ui.theme_switch_light : t.ui.theme_switch_dark}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
        'text-text-muted hover:bg-surface-raised hover:text-text-primary',
        className
      )}
    >
      {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    </button>
  )
}
