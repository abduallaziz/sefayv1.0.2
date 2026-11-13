'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { documentsApi } from '../api/documents.api'
import type { ElementLayout, ElementStyle, TemplateElement } from '../types'

interface Props {
  element: TemplateElement
  onElement: (patch: Partial<TemplateElement>) => void
  /** A flow block exists before this one, so it may be placed beside it. */
  canJoin: boolean
}

const INFO_SECTION: Record<string, string> = {
  company_info: 'company',
  customer_info: 'customer',
  document_info: 'document',
  payment_details: 'payment',
}

const labelCls = 'text-xs font-medium text-slate-600 dark:text-gray-400'
const numCls =
  'h-9 w-full rounded border border-slate-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-900'
const selCls = numCls

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value?: string
  onChange: (v: string | undefined) => void
}) {
  const t = useTranslations('documents.style')
  return (
    <div className="space-y-1">
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          aria-label={label}
          value={value ?? '#ffffff'}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-gray-700"
        />
        <span className="flex-1 text-xs tabular-nums text-slate-500">{value ?? t('none')}</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label={t('clear')}
            title={t('clear')}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function NumField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  value?: number
  min: number
  max: number
  step?: number
  onChange: (v: number | undefined) => void
}) {
  return (
    <label className="space-y-1">
      <span className={labelCls}>{label}</span>
      <input
        type="number"
        className={numCls}
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          const n = Number(raw)
          onChange(raw === '' || !Number.isFinite(n) ? undefined : Math.min(max, Math.max(min, n)))
        }}
      />
    </label>
  )
}

/** Colours, box and layout options of a block, and the per-block display options. */
export function StyleSection({ element, onElement, canJoin }: Props) {
  const t = useTranslations('documents.style')
  const locale = useLocale()
  const lang = locale === 'en' ? 'en' : 'ar'
  const catalog = useQuery({ queryKey: ['documents', 'bindings'], queryFn: documentsApi.bindings, staleTime: 10 * 60_000 })

  const isFlow = element.region === 'flow'
  const style = element.style ?? {}
  const layout = element.layout ?? {}
  const cfg = element.config ?? {}

  const setStyle = (patch: Partial<ElementStyle>) => onElement({ style: { ...style, ...patch } })
  const setLayout = (patch: Partial<ElementLayout>) => onElement({ layout: { ...layout, ...patch } })
  const setCfg = (patch: Record<string, unknown>) => onElement({ config: { ...cfg, ...patch } })

  const section = INFO_SECTION[element.type]
  const fieldDefs = section
    ? (catalog.data?.bindings ?? [])
        .filter((b) => b.group === section)
        .map((b) => ({ key: b.path.split('.')[1], label: b.label[lang] }))
    : []
  const chosen = Array.isArray(cfg.fields) ? (cfg.fields as string[]) : fieldDefs.map((f) => f.key)
  const toggleField = (key: string, on: boolean) => {
    const next = on ? [...chosen.filter((k) => k !== key), key] : chosen.filter((k) => k !== key)
    // keep the catalog order for a stable layout
    const ordered = fieldDefs.map((f) => f.key).filter((k) => next.includes(k))
    setCfg({ fields: ordered })
  }

  return (
    <div className="space-y-4">
      {isFlow && (
        <section className="space-y-2 rounded-lg border border-slate-200 p-2.5 dark:border-gray-800">
          <h4 className="text-xs font-bold text-slate-700 dark:text-gray-200">{t('layout')}</h4>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#0C447C]"
              checked={layout.sideBySide === true}
              disabled={!canJoin}
              onChange={(e) => setLayout({ sideBySide: e.target.checked })}
            />
            {t('sideBySide')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#0C447C]"
              checked={layout.divider === true}
              disabled={!canJoin}
              onChange={(e) => setLayout({ divider: e.target.checked })}
            />
            {t('divider')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <NumField
              label={t('widthPct')}
              value={layout.width}
              min={5}
              max={100}
              onChange={(width) => setLayout({ width })}
            />
            <label className="space-y-1">
              <span className={labelCls}>{t('place')}</span>
              <select
                className={selCls}
                value={layout.place ?? 'start'}
                onChange={(e) => setLayout({ place: e.target.value as 'start' | 'center' | 'end' })}
              >
                <option value="start">{t('start')}</option>
                <option value="center">{t('center')}</option>
                <option value="end">{t('end')}</option>
              </select>
            </label>
          </div>
        </section>
      )}

      <section className="space-y-2 rounded-lg border border-slate-200 p-2.5 dark:border-gray-800">
        <h4 className="text-xs font-bold text-slate-700 dark:text-gray-200">{t('format')}</h4>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label={t('textColor')} value={style.color} onChange={(color) => setStyle({ color })} />
          <ColorField label={t('bgColor')} value={style.bg} onChange={(bg) => setStyle({ bg })} />
          <ColorField label={t('borderColor')} value={style.border} onChange={(border) => setStyle({ border })} />
          <NumField
            label={t('borderWidth')}
            value={style.borderWidth}
            min={0}
            max={2}
            step={0.1}
            onChange={(borderWidth) => setStyle({ borderWidth })}
          />
          <NumField label={t('radius')} value={style.radius} min={0} max={30} onChange={(radius) => setStyle({ radius })} />
          <NumField label={t('padding')} value={style.padding} min={0} max={30} onChange={(padding) => setStyle({ padding })} />
          <NumField label={t('fontSize')} value={style.fontSize} min={6} max={72} onChange={(fontSize) => setStyle({ fontSize })} />
          {isFlow && (
            <NumField label={t('spaceBefore')} value={style.spaceBefore} min={0} max={60} onChange={(spaceBefore) => setStyle({ spaceBefore })} />
          )}
          <label className="space-y-1">
            <span className={labelCls}>{t('textAlign')}</span>
            <select
              className={selCls}
              value={style.align ?? ''}
              onChange={(e) => setStyle({ align: (e.target.value || undefined) as ElementStyle['align'] })}
            >
              <option value="">{t('auto')}</option>
              <option value="start">{t('start')}</option>
              <option value="center">{t('center')}</option>
              <option value="end">{t('end')}</option>
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#0C447C]"
            checked={style.weight === 'bold'}
            onChange={(e) => setStyle({ weight: e.target.checked ? 'bold' : undefined })}
          />
          {t('bold')}
        </label>
      </section>

      {section && (
        <section className="space-y-2 rounded-lg border border-slate-200 p-2.5 dark:border-gray-800">
          <h4 className="text-xs font-bold text-slate-700 dark:text-gray-200">{t('fields')}</h4>
          <div className="grid grid-cols-2 gap-1">
            {fieldDefs.map((f) => (
              <label key={f.key} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#0C447C]"
                  checked={chosen.includes(f.key)}
                  onChange={(e) => toggleField(f.key, e.target.checked)}
                />
                {f.label}
              </label>
            ))}
          </div>
          <label className="space-y-1">
            <span className={labelCls}>{t('labelMode')}</span>
            <select
              className={selCls}
              value={(cfg.labelMode as string | undefined) ?? 'split'}
              onChange={(e) => setCfg({ labelMode: e.target.value })}
            >
              <option value="split">{t('labelSplit')}</option>
              <option value="inline">{t('labelInline')}</option>
              <option value="none">{t('labelNone')}</option>
            </select>
          </label>
          <ColorField label={t('rowBg')} value={cfg.rowBg as string | undefined} onChange={(v) => setCfg({ rowBg: v })} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#0C447C]"
              checked={cfg.icons === true}
              onChange={(e) => setCfg({ icons: e.target.checked })}
            />
            {t('icons')}
          </label>
        </section>
      )}

      {element.type === 'items_table' && (
        <section className="space-y-2 rounded-lg border border-slate-200 p-2.5 dark:border-gray-800">
          <ColorField label={t('headerBg')} value={cfg.headerBg as string | undefined} onChange={(v) => setCfg({ headerBg: v })} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#0C447C]"
              checked={cfg.grid === true}
              onChange={(e) => setCfg({ grid: e.target.checked })}
            />
            {t('grid')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#0C447C]"
              checked={cfg.showCurrency === true}
              onChange={(e) => setCfg({ showCurrency: e.target.checked })}
            />
            {t('showCurrency')}
          </label>
        </section>
      )}

      {element.type === 'terms' && (
        <section className="space-y-2 rounded-lg border border-slate-200 p-2.5 dark:border-gray-800">
          <label className="space-y-1">
            <span className={labelCls}>{t('termsTitle')}</span>
            <input
              className={numCls}
              maxLength={120}
              value={(cfg.title as string | undefined) ?? ''}
              onChange={(e) => setCfg({ title: e.target.value || undefined })}
            />
          </label>
          <ColorField label={t('titleBg')} value={cfg.titleBg as string | undefined} onChange={(v) => setCfg({ titleBg: v })} />
          <ColorField label={t('bulletColor')} value={cfg.bulletColor as string | undefined} onChange={(v) => setCfg({ bulletColor: v })} />
        </section>
      )}

      {element.type === 'totals' && (
        <section className="space-y-2 rounded-lg border border-slate-200 p-2.5 dark:border-gray-800">
          <ColorField label={t('labelBg')} value={cfg.labelBg as string | undefined} onChange={(v) => setCfg({ labelBg: v })} />
          <ColorField label={t('accent')} value={cfg.accent as string | undefined} onChange={(v) => setCfg({ accent: v })} />
          <ColorField label={t('accentValue')} value={cfg.accentValue as string | undefined} onChange={(v) => setCfg({ accentValue: v })} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#0C447C]"
              checked={cfg.showCurrency === true}
              onChange={(e) => setCfg({ showCurrency: e.target.checked })}
            />
            {t('showCurrency')}
          </label>
        </section>
      )}
    </div>
  )
}
