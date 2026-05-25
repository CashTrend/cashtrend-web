'use client'

/**
 * FieldTooltip — inline click-toggle explanation panel for financial fields.
 *
 * Renders a small Info icon button next to a field label. Clicking it toggles
 * an inline panel (in DOM flow, not floating) showing:
 *   - label (bold)
 *   - summary (secondary text)
 *   - detail (muted text, smaller)
 *
 * Accessibility:
 *   - button has aria-expanded
 *   - panel has role="note" and is associated via aria-controls
 *   - keyboard: Enter/Space toggle; Escape closes
 *
 * Only one tooltip can be open per component instance. If you want a single
 * open-at-a-time behaviour across a section, manage the open state in the
 * parent and pass isOpen/onToggle instead.
 *
 * Usage:
 *   <FieldTooltip entry={t.glossary.ratios.beta} />
 */

import { useState, useId } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GlossaryEntry } from '@/lib/i18n/types'

interface FieldTooltipProps {
  /** Glossary entry to display. */
  entry: GlossaryEntry
  className?: string
}

export function FieldTooltip({ entry, className }: FieldTooltipProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <span className={cn('inline-flex flex-col', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`More information about ${entry.label}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded transition-colors',
          'text-text-muted hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
          open && 'text-brand'
        )}
      >
        <Info size={13} aria-hidden="true" />
      </button>

      {open && (
        <span
          id={panelId}
          role="note"
          className={cn(
            'mt-1.5 block w-64 max-w-[min(16rem,calc(100vw-2rem))] rounded-lg border border-border',
            'bg-surface p-3 shadow-md text-left'
          )}
        >
          <span className="block text-xs font-semibold text-text-primary">{entry.label}</span>
          <span className="mt-1 block text-xs text-text-secondary">{entry.summary}</span>
          <span className="mt-1.5 block text-[11px] leading-relaxed text-text-muted">
            {entry.detail}
          </span>
        </span>
      )}
    </span>
  )
}
