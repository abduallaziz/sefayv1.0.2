'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowDown, ArrowUp, Eye, EyeOff, Lock } from 'lucide-react'
import { isOverlay } from '../../lib/elements'
import type { TemplateElement } from '../../types'

interface Props {
  elements: TemplateElement[]
  selectedId: string | null
  onSelect: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onToggleVisible: (id: string) => void
  /** The Properties tab content (the shared Inspector). */
  children: ReactNode
}

export function QuoteLeftPanel({ elements, selectedId, onSelect, onMove, onToggleVisible, children }: Props) {
  const t = useTranslations('documents.editor')
  const [tab, setTab] = useState<'props' | 'layers'>('props')
  const flow = elements.filter((e) => !isOverlay(e))
  const overlays = elements.filter(isOverlay).sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))

  const row = (e: TemplateElement, movable: boolean, idx: number, total: number) => (
    <li key={e.id}>
      <div
        className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-sm ${
          selectedId === e.id
            ? 'border-[#0C447C] bg-[#E8F1FB] dark:bg-[#0C447C]/20'
            : 'border-slate-200 bg-white hover:border-[#14B8A6] dark:border-gray-800 dark:bg-gray-900'
        }`}
      >
        <button type="button" className="min-w-0 flex-1 truncate text-start" onClick={() => onSelect(e.id)}>
          {t(`block.${e.type}` as never)}
        </button>
        {e.locked && <Lock className="h-3.5 w-3.5 text-slate-400" aria-hidden />}
        <button
          type="button"
          className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800"
          aria-label={t('visible')}
          onClick={() => onToggleVisible(e.id)}
        >
          {e.visible === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        {movable && (
          <>
            <button
              type="button"
              disabled={idx === 0}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-gray-800"
              aria-label={t('moveUp')}
              onClick={() => onMove(e.id, -1)}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={idx === total - 1}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-gray-800"
              aria-label={t('moveDown')}
              onClick={() => onMove(e.id, 1)}
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </li>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="tablist" className="flex shrink-0 border-b border-slate-200 dark:border-gray-800">
        {(
          [
            ['props', t('inspector')],
            ['layers', t('layers')],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 px-2 py-3 text-sm font-semibold transition-colors ${
              tab === id
                ? 'border-b-2 border-[#0C447C] text-[#0C447C] dark:text-sky-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === 'props' ? (
          children
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">{t('flowHint')}</p>
            <ul className="space-y-1.5">{flow.map((e, i) => row(e, true, i, flow.length))}</ul>
            {overlays.length > 0 && (
              <ul className="space-y-1.5 border-t border-slate-200 pt-3 dark:border-gray-800">
                {overlays.map((e, i) => row(e, false, i, overlays.length))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
