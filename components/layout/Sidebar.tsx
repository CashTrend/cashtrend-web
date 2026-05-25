'use client'

/**
 * Sidebar — primary navigation for the dashboard layout.
 *
 * Desktop (lg+): fixed left column, always visible, 240px wide.
 * Mobile (<lg):  hidden by default; slides in as a drawer when toggled.
 *                A semi-transparent overlay closes it on outside click.
 *
 * Navigation items:
 *   / (Dashboard)        — Portfolio overview & P&L summary
 *   /portfolio           — Transaction history & management
 *   /tickers             — Ticker search & detail explorer
 *
 * Active state is derived from the current pathname via usePathname().
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ReceiptText, Search, TrendingUp, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { useLocale } from '@/context/locale-context'

interface NavItem {
  labelKey: 'dashboard' | 'portfolio' | 'tickers'
  href: string
  icon: React.ReactNode
  /** Match any path that starts with this prefix (for nested routes). */
  matchPrefix?: string
}

const NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'dashboard',
    href: '/',
    icon: <LayoutDashboard size={18} aria-hidden="true" />,
  },
  {
    labelKey: 'portfolio',
    href: '/portfolio',
    icon: <ReceiptText size={18} aria-hidden="true" />,
    matchPrefix: '/portfolio',
  },
  {
    labelKey: 'tickers',
    href: '/tickers',
    icon: <Search size={18} aria-hidden="true" />,
    matchPrefix: '/tickers',
  },
]

/** Determine whether a nav item is active given the current pathname. */
function isActive(item: NavItem, pathname: string): boolean {
  if (item.matchPrefix) return pathname.startsWith(item.matchPrefix)
  return pathname === item.href
}

export function Sidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const { t } = useLocale()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!mobileOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
        <TrendingUp size={18} className="shrink-0 text-brand" aria-hidden="true" />
        <span className="text-sm font-bold tracking-tight text-sidebar-text-active">
          {t.ui.app_name}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label={t.nav.main_nav}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item, pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-active text-sidebar-text-active'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
              )}
            >
              {item.icon}
              {t.nav[item.labelKey]}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-sidebar-border p-3">
        {/* User info */}
        {user && (
          <div className="mb-2 flex items-center gap-2.5 px-3 py-2">
            {/* Avatar */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white uppercase">
              {user.username.charAt(0)}
            </div>
            <span className="truncate text-xs font-medium text-sidebar-text">{user.username}</span>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-sidebar-text-active"
        >
          <LogOut size={18} aria-hidden="true" />
          {t.nav.sign_out}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar-bg lg:flex lg:flex-col"
        aria-label={t.nav.sidebar}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile: hamburger trigger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label={t.nav.open_nav}
        aria-expanded={mobileOpen}
        className={cn(
          'fixed left-4 top-3.5 z-40 flex h-8 w-8 items-center justify-center rounded-lg',
          'bg-sidebar-bg text-sidebar-text shadow-md lg:hidden'
        )}
      >
        <Menu size={18} aria-hidden="true" />
      </button>

      {/* ── Mobile: overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: drawer ── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t.nav.navigation}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen ? true : undefined}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 border-r border-sidebar-border bg-sidebar-bg',
          'transition-transform duration-200 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          aria-label={t.nav.close_nav}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-sidebar-text hover:bg-sidebar-hover"
        >
          <X size={16} aria-hidden="true" />
        </button>
        {sidebarContent}
      </aside>
    </>
  )
}
