'use client'

import { useTranslations } from 'next-intl'
import { ArrowDown, ArrowUp, Eye, EyeOff, Lock, Plus } from 'lucide-react'
import Link from 'next/link'
import { FLOW_TYPES, type DocumentAsset, type FlowType, type TemplateElement } from '../types'
import { isOverlay } from '../lib/elements'

interface Props {
  elements: TemplateElement[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (type: FlowType) => void
  onMove: (id: string, dir: -1 | 1) => void
  onToggleVisible: (id: string) => void
  assets: DocumentAsset[]
  onAddAsset: (asset: DocumentAsset) => void
  onAddQr: (type: 'qr' | 'signature_qr', kind: 'verification' | 'zatca' | 'payment' | 'custom_url') => void
}

const sectionTitle = 'mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400'

export function ElementsPanel({
  elements,
  selectedId,
  onSelect,
  onAdd,
  onMove,
  onToggleVisible,
  assets,
  onAddAsset,
  onAddQr,
}: Props) {
  const t = useTranslations('documents.editor')
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
          aria-label={t('layers')}
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
    <div className="space-y-5">
      <section>
        <h3 className={sectionTitle}>{t('addElement')}</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {FLOW_TYPES.map((ft) => (
            <button
              key={ft}
              type="button"
              onClick={() => onAdd(ft)}
              className="flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-start text-xs font-medium text-slate-700 transition-colors hover:border-[#0C447C] hover:bg-[#E8F1FB] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            >
              <Plus className="h-3.5 w-3.5 shrink-0 text-[#0C447C]" aria-hidden />
              <span className="truncate">{t(`block.${ft}` as never)}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>{t('assets')}</h3>
        {assets.length === 0 ? (
          <p className="text-xs text-slate-500">{t('noAssets')}</p>
        ) : (
          <ul className="space-y-1.5">
            {assets.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onAddAsset(a)}
                  className="flex min-h-10 w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-start text-xs font-medium text-slate-700 transition-colors hover:border-[#0C447C] hover:bg-[#E8F1FB] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0 text-[#0C447C]" aria-hidden />
                  <span className="truncate">{a.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/dashboard/settings/documents/assets"
          className="mt-2 inline-block text-xs font-medium text-[#0C447C] underline"
        >
          {t('openLibrary')}
        </Link>
      </section>

      <section>
        <h3 className={sectionTitle}>{t('qr.title')}</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {(['verification', 'zatca', 'payment', 'custom_url'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onAddQr('qr', k)}
              className="flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-start text-xs font-medium text-slate-700 transition-colors hover:border-[#0C447C] hover:bg-[#E8F1FB] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            >
              <Plus className="h-3.5 w-3.5 shrink-0 text-[#0C447C]" aria-hidden />
              <span className="truncate">{t(`qr.${k}` as never)}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onAddQr('signature_qr', 'verification')}
            className="col-span-2 flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-start text-xs font-medium text-slate-700 transition-colors hover:border-[#0C447C] hover:bg-[#E8F1FB] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            <Plus className="h-3.5 w-3.5 shrink-0 text-[#0C447C]" aria-hidden />
            <span className="truncate">{t('block.signature_qr')}</span>
          </button>
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>{t('layers')}</h3>
        <p className="mb-2 text-xs text-slate-500">{t('flowHint')}</p>
        <ul className="space-y-1.5">{flow.map((e, i) => row(e, true, i, flow.length))}</ul>
        {overlays.length > 0 && <ul className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 dark:border-gray-800">{overlays.map((e, i) => row(e, false, i, overlays.length))}</ul>}
      </section>
    </div>
  )
}
