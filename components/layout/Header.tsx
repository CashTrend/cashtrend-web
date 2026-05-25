'use client'

/**
 * Header — top bar of the dashboard layout.
 *
 * Shows:
 *   - Current page title (derived from pathname, translated)
 *   - EN/ES locale toggle
 *   - ThemeToggle
 *   - User avatar with username (from AuthContext)
 *
 * Stays sticky at the top of the content area (not the sidebar).
 */

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from '@/context/auth-context'
import { useLocale } from '@/context/locale-context'
import { cn } from '@/lib/utils'
import { interpolate } from '@/lib/i18n/types'
import type { Locale } from '@/lib/i18n/types'

const ThemeToggle = dynamic(() => import('./ThemeToggle').then((mod) => mod.ThemeToggle), {
  ssr: false,
  loading: () => <span className="h-8 w-8 rounded-lg" aria-hidden="true" />,
})

function getPageTitle(
  pathname: string,
  titles: {
    dashboard: string
    portfolio: string
    new_transaction: string
    tickers: string
    edit_transaction: string
    ticker_detail: string
    fallback: string
  }
): string {
  if (pathname === '/') return titles.dashboard
  if (pathname === '/portfolio') return titles.portfolio
  if (pathname === '/portfolio/new') return titles.new_transaction
  if (pathname === '/tickers') return titles.tickers
  if (/^\/portfolio\/\d+\/edit$/.test(pathname)) return titles.edit_transaction
  if (pathname.startsWith('/tickers/')) {
    const symbol = pathname.split('/')[2]?.toUpperCase()
    return symbol ? symbol : titles.ticker_detail
  }
  return titles.fallback
}

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { t, locale, setLocale } = useLocale()

  const title = getPageTitle(pathname, {
    dashboard: t.header.page_dashboard,
    portfolio: t.header.page_portfolio,
    new_transaction: t.header.page_new_transaction,
    tickers: t.header.page_tickers,
    edit_transaction: t.header.page_edit_transaction,
    ticker_detail: t.header.page_ticker_detail,
    fallback: t.header.fallback,
  })

  const nextLocale: Locale = locale === 'en' ? 'es' : 'en'

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between gap-4',
        'border-b border-border bg-surface px-4 lg:px-6',
        className
      )}
    >
      {/* Page title — leaves space for the mobile hamburger button (lg:hidden) */}
      <h1 className="truncate pl-10 text-base font-semibold text-text-primary lg:pl-0">{title}</h1>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        {/* Locale toggle */}
        <button
          onClick={() => setLocale(nextLocale)}
          aria-label={`Switch language to ${nextLocale.toUpperCase()}`}
          className={cn(
            'flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors',
            'text-text-muted hover:bg-surface-raised hover:text-text-primary'
          )}
        >
          {t.ui.language_toggle_label}
        </button>

        <ThemeToggle />

        {/* User avatar */}
        {user && (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold uppercase text-white"
            aria-label={interpolate(t.header.signed_in_as, { username: user.username })}
            title={user.username}
          >
            {user.username.charAt(0)}
          </div>
        )}
      </div>
    </header>
  )
}
