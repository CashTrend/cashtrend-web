'use client'

/**
 * Header — top bar of the dashboard layout.
 *
 * Shows:
 *   - Current page title (derived from pathname)
 *   - ThemeToggle
 *   - User avatar with username (from AuthContext)
 *
 * Stays sticky at the top of the content area (not the sidebar).
 */

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'

const ThemeToggle = dynamic(() => import('./ThemeToggle').then((mod) => mod.ThemeToggle), {
  ssr: false,
  loading: () => <span className="h-8 w-8 rounded-lg" aria-hidden="true" />,
})

/** Map pathnames to human-readable page titles. */
const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/portfolio': 'Portfolio',
  '/portfolio/new': 'New Transaction',
  '/tickers': 'Tickers',
}

function getPageTitle(pathname: string): string {
  // Exact match
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  // Edit transaction: /portfolio/[id]/edit
  if (/^\/portfolio\/\d+\/edit$/.test(pathname)) return 'Edit Transaction'
  // Dynamic ticker detail: /tickers/AAPL
  if (pathname.startsWith('/tickers/')) {
    const symbol = pathname.split('/')[2]?.toUpperCase()
    return symbol ? `${symbol}` : 'Ticker'
  }
  return 'CashTrend'
}

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const title = getPageTitle(pathname)

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
        <ThemeToggle />

        {/* User avatar */}
        {user && (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold uppercase text-white"
            aria-label={`Signed in as ${user.username}`}
            title={user.username}
          >
            {user.username.charAt(0)}
          </div>
        )}
      </div>
    </header>
  )
}
