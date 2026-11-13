'use client'

import { useMemo, useState, type ComponentType } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Building2,
  Calculator,
  ChevronDown,
  CreditCard,
  FileText,
  Heading,
  Image as ImageIcon,
  ImagePlus,
  Minus,
  PenLine,
  Plus,
  QrCode,
  ScrollText,
  Search,
  SeparatorHorizontal,
  Stamp,
  Table2,
  Type,
  User,
} from 'lucide-react'
import { BindingPicker } from '../BindingPicker'
import type { DocumentAsset, FlowType } from '../../types'

type QrKind = 'verification' | 'zatca' | 'payment' | 'custom_url'
type Tab = 'elements' | 'fields' | 'assets'

interface Props {
  assets: DocumentAsset[]
  /** True when the selected element is a text-like block a field can be inserted into. */
  canInsertField: boolean
  onAdd: (type: FlowType) => void
  onAddAsset: (asset: DocumentAsset) => void
  onAddQr: (type: 'qr' | 'signature_qr', kind: QrKind) => void
  onInsertField: (path: string) => void
}

interface Tile {
  key: string
  label: string
  icon: ComponentType<{ className?: string }>
  run: () => void
}

const CATEGORY_GROUPS: { key: string; categories: string[] }[] = [
  { key: 'stamps', categories: ['company_stamp', 'branch_stamp', 'department_stamp'] },
  { key: 'signatures', categories: ['signature'] },
  { key: 'images', categories: ['logo', 'image'] },
]

export function QuoteSidebar({ assets, canInsertField, onAdd, onAddAsset, onAddQr, onInsertField }: Props) {
  const t = useTranslations('documents.editor')
  const tq = useTranslations('documents.quote')
  const [tab, setTab] = useState<Tab>('elements')
  const [q, setQ] = useState('')
  const [closed, setClosed] = useState<Record<string, boolean>>({})

  const flow = (type: FlowType, icon: Tile['icon']): Tile => ({
    key: type,
    label: t(`block.${type}` as never),
    icon,
    run: () => onAdd(type),
  })
  const qr = (kind: QrKind): Tile => ({
    key: `qr-${kind}`,
    label: t(`qr.${kind}` as never),
    icon: QrCode,
    run: () => onAddQr('qr', kind),
  })

  const groups = useMemo(
    () =>
      [
        {
          key: 'basic',
          title: tq('groupBasic'),
          tiles: [
            { key: 'logo', label: t('block.logo'), icon: ImageIcon, run: () => setTab('assets') },
            { key: 'image', label: t('block.image'), icon: ImagePlus, run: () => setTab('assets') },
            flow('heading', Heading),
            flow('text', Type),
            flow('divider', Minus),
            flow('page_break', SeparatorHorizontal),
          ],
        },
        {
          key: 'ready',
          title: tq('groupReady'),
          tiles: [
            flow('company_info', Building2),
            flow('customer_info', User),
            flow('document_info', FileText),
            flow('items_table', Table2),
            flow('totals', Calculator),
            flow('payment_details', CreditCard),
            flow('terms', ScrollText),
            flow('footer', ScrollText),
          ],
        },
        {
          key: 'approval',
          title: tq('groupApproval'),
          tiles: [
            { key: 'stamp', label: t('block.stamp'), icon: Stamp, run: () => setTab('assets') },
            { key: 'signature', label: t('block.signature'), icon: PenLine, run: () => setTab('assets') },
            qr('verification'),
            qr('zatca'),
            qr('payment'),
            qr('custom_url'),
          ],
        },
      ] as { key: string; title: string; tiles: Tile[] }[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tq, onAdd, onAddQr],
  )

  const needle = q.trim().toLowerCase()
  const visible = groups
    .map((g) => ({ ...g, tiles: g.tiles.filter((x) => !needle || x.label.toLowerCase().includes(needle)) }))
    .filter((g) => g.tiles.length > 0)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'elements', label: tq('tabElements') },
    { id: 'fields', label: tq('tabFields') },
    { id: 'assets', label: tq('tabAssets') },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="tablist" className="flex shrink-0 border-b border-slate-200 dark:border-gray-800">
        {tabs.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className={`flex-1 px-2 py-3 text-sm font-semibold transition-colors ${
              tab === x.id
                ? 'border-b-2 border-[#0C447C] text-[#0C447C] dark:text-sky-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-gray-400'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {tab === 'elements' && (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tq('searchElements')}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white ps-9 pe-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C447C]/30 dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            {visible.map((g) => (
              <section key={g.key}>
                <button
                  type="button"
                  onClick={() => setClosed((c) => ({ ...c, [g.key]: !c[g.key] }))}
                  className="mb-2 flex w-full items-center justify-between text-sm font-bold text-slate-800 dark:text-white"
                  aria-expanded={!closed[g.key]}
                >
                  <span>{g.title}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${closed[g.key] ? '-rotate-90' : ''}`} aria-hidden />
                </button>
                {!closed[g.key] && (
                  <div className="grid grid-cols-3 gap-2">
                    {g.tiles.map((tile) => (
                      <button
                        key={tile.key}
                        type="button"
                        onClick={tile.run}
                        className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-1 py-2 text-center text-[11px] font-medium leading-tight text-slate-700 transition-colors hover:border-[#0C447C] hover:bg-[#E8F1FB] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      >
                        <tile.icon className="h-5 w-5 text-[#0C447C] dark:text-sky-300" aria-hidden />
                        <span className="line-clamp-2">{tile.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            ))}
            {visible.length === 0 && <p className="text-xs text-slate-500">{tq('noResults')}</p>}
          </>
        )}

        {tab === 'fields' && (
          <>
            <p className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600 dark:bg-gray-800 dark:text-gray-300">
              {canInsertField ? tq('insertHint') : tq('selectTextFirst')}
            </p>
            <BindingPicker onInsert={(path) => canInsertField && onInsertField(path)} />
          </>
        )}

        {tab === 'assets' && (
          <>
            {assets.length === 0 && <p className="text-xs text-slate-500">{t('noAssets')}</p>}
            {CATEGORY_GROUPS.map((g) => {
              const items = assets.filter((a) => g.categories.includes(a.category))
              if (items.length === 0) return null
              return (
                <section key={g.key}>
                  <h3 className="mb-2 text-sm font-bold text-slate-800 dark:text-white">{tq(`assets.${g.key}` as never)}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {items.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onAddAsset(a)}
                        className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-1 py-2 text-center text-[11px] font-medium leading-tight text-slate-700 transition-colors hover:border-[#0C447C] hover:bg-[#E8F1FB] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      >
                        {g.key === 'stamps' ? (
                          <Stamp className="h-5 w-5 text-[#0C447C]" aria-hidden />
                        ) : g.key === 'signatures' ? (
                          <PenLine className="h-5 w-5 text-[#0C447C]" aria-hidden />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-[#0C447C]" aria-hidden />
                        )}
                        <span className="line-clamp-2">{a.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )
            })}
            <Link
              href="/dashboard/settings/documents/assets"
              className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#0C447C]/40 text-xs font-semibold text-[#0C447C] transition-colors hover:bg-[#E8F1FB] dark:text-sky-300"
            >
              <Plus className="h-5 w-5" aria-hidden />
              {tq('uploadAsset')}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
