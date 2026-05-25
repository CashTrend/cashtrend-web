/**
 * Auth layout — shared visual shell for /login and /register.
 *
 * Centers the form card on the screen with a branded header.
 * Uses a split layout on desktop: left brand panel + right form panel.
 */

import type { Metadata } from 'next'
import { TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CashTrend — Sign in',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden w-1/2 flex-col justify-between bg-sidebar-bg p-12 lg:flex border-r border-sidebar-border">
        {/* Logo */}
        <div className="flex items-center gap-2 text-sidebar-text">
          <TrendingUp size={22} className="text-brand" />
          <span className="text-lg font-bold tracking-tight">CashTrend</span>
        </div>

        {/* Tagline */}
        <div className="flex flex-col gap-3">
          <p className="text-2xl font-medium leading-snug text-sidebar-text">
            &ldquo;Track every position. Understand every move. Grow with confidence.&rdquo;
          </p>
          <p className="text-sm text-sidebar-text/70">
            Real-time portfolio tracking — stocks, ETFs, crypto, and cash flow in one place.
          </p>
        </div>

        {/* Bottom decoration */}
        <p className="text-xs text-sidebar-text/70">&copy; {new Date().getFullYear()} CashTrend</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <TrendingUp size={20} className="text-brand" />
          <span className="text-base font-bold text-text-primary">CashTrend</span>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
