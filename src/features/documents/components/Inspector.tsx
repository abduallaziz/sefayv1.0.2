'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react'
import { documentsApi } from '../api/documents.api'
import { BindingPicker } from './BindingPicker'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { OverlaySection } from './OverlaySection'
import { QrSection } from './QrSection'
import { StyleSection } from './StyleSection'
import { PAPERS, type Orientation, type Paper, type TableColumn, type TemplateBody, type TemplateElement } from '../types'
import type { DraftState } from '../hooks/useTemplateDraft'

interface Props {
  draft: DraftState
  element: TemplateElement | null
  onMeta: (patch: Partial<Pick<DraftState, 'name' | 'paper' | 'orientation'>>) => void
  onMargin: (mm: number) => void
  onBody: (patch: Partial<TemplateBody>) => void
  onElement: (patch: Partial<TemplateElement>) => void
  onRemove: () => void
  onDuplicate: () => void
  pageSizeMm: { w: number; h: number }
  /** A flow block exists before the selected one (so it can sit beside it). */
  canJoin?: boolean
}

const label = 'text-xs font-medium text-slate-600 dark:text-gray-400'
const selectCls =
  'h-10 w-full rounded border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40'

function Field({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={label}>{l}</label>
      {children}
    </div>
  )
}

export function Inspector({
  draft,
  element,
  onMeta,
  onMargin,
  onBody,
  onElement,
  onRemove,
  onDuplicate,
  pageSizeMm,
  canJoin = false,
}: Props) {
  const t = useTranslations('documents')
  const te = useTranslations('documents.editor')
  const locale = useLocale()
  const textRef = useRef<HTMLTextAreaElement>(null)
  const catalog = useQuery({ queryKey: ['documents', 'bindings'], queryFn: documentsApi.bindings, staleTime: 10 * 60_000 })
  const known = new Set((catalog.data?.bindings ?? []).map((b) => b.path))

  if (!element) {
    const m = draft.body.pages[0]?.marginsMm
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-white">{te('pageSettings')}</h3>
        <Field l={t('name')}>
          <Input value={draft.name} maxLength={120} onChange={(e) => onMeta({ name: e.target.value })} />
        </Field>
        <Field l={t('paper')}>
          <select className={selectCls} value={draft.paper} onChange={(e) => onMeta({ paper: e.target.value as Paper })}>
            {PAPERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field l={t('orientation')}>
          <select
            className={selectCls}
            value={draft.orientation}
            onChange={(e) => onMeta({ orientation: e.target.value as Orientation })}
          >
            <option value="portrait">{t('portrait')}</option>
            <option value="landscape">{t('landscape')}</option>
          </select>
        </Field>
        <Field l={te('marginMm')}>
          <Input
            type="number"
            min={0}
            max={60}
            value={m?.top ?? 10}
            onChange={(e) => onMargin(Math.min(60, Math.max(0, Number(e.target.value) || 0)))}
          />
        </Field>
        <Field l={te('bindings.missing')}>
          <select
            className={selectCls}
            value={draft.body.missingValue ?? 'blank'}
            onChange={(e) => onBody({ missingValue: e.target.value as 'blank' | 'dash' })}
          >
            <option value="blank">{te('bindings.missingBlank')}</option>
            <option value="dash">{te('bindings.missingDash')}</option>
          </select>
        </Field>
        <p className="text-xs text-slate-500">{te('nothingSelected')}</p>
      </div>
    )
  }

  const hasText = ['heading', 'text', 'terms', 'footer', 'text_box'].includes(element.type)
const styleable = element.region === 'flow' ? !['divider', 'page_break'].includes(element.type) : element.type === 'text_box'
  const cols: TableColumn[] = element.config?.columns ?? []
  const used = [...(element.config?.text ?? '').matchAll(/\{\{\s*([^{}]*?)\s*\}\}/g)].map((m) => m[1])
  const unknown = known.size > 0 ? used.filter((u) => !known.has(u)) : []
  const lang = locale === 'en' ? 'en' : 'ar'
  const setCols = (next: TableColumn[]) => onElement({ config: { ...element.config, columns: next } })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-slate-700 dark:text-white">
          {te(`block.${element.type}` as never)}
        </h3>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onDuplicate} aria-label={t('duplicate')}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onRemove} aria-label={te('remove')}>
            <Trash2 className="h-4 w-4 text-posCloud-danger" />
          </Button>
        </div>
      </div>

      {(element.type === 'qr' || element.type === 'signature_qr') && <QrSection element={element} onElement={onElement} />}

      {element.region === 'overlay' && element.position && element.size && (
        <OverlaySection element={element} onElement={onElement} pageSizeMm={pageSizeMm} />
      )}

      {hasText && (
        <Field l={te('text')}>
          <textarea
            ref={textRef}
            className="min-h-28 w-full rounded border border-posCloud-border bg-posCloud-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40 dark:border-posCloudDark-border dark:bg-posCloudDark-background"
            value={element.config?.text ?? ''}
            onChange={(e) => onElement({ config: { ...element.config, text: e.target.value } })}
          />
          <p className="text-xs text-slate-500">{te('textHint')}</p>
          {unknown.length > 0 && (
            <p className="text-xs font-medium text-posCloud-danger">
              {te('bindings.unknown')} {unknown.map((u) => `{{${u}}}`).join(' ')}
            </p>
          )}
          <BindingPicker
            onInsert={(path) => {
              const cur = element.config?.text ?? ''
              const ta = textRef.current
              const start = ta?.selectionStart ?? cur.length
              const end = ta?.selectionEnd ?? cur.length
              const token = `{{${path}}}`
              onElement({ config: { ...element.config, text: cur.slice(0, start) + token + cur.slice(end) } })
              // keep the caret right after the inserted field
              requestAnimationFrame(() => {
                ta?.focus()
                ta?.setSelectionRange(start + token.length, start + token.length)
              })
            }}
          />
        </Field>
      )}

      {styleable && <StyleSection element={element} onElement={onElement} canJoin={canJoin} />}

      {element.type === 'items_table' && (
        <section className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#0C447C]"
              checked={element.config?.repeatHeader !== false}
              onChange={(e) => onElement({ config: { ...element.config, repeatHeader: e.target.checked } })}
            />
            {te('table.repeatHeader')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#0C447C]"
              checked={element.config?.zebra === true}
              onChange={(e) => onElement({ config: { ...element.config, zebra: e.target.checked } })}
            />
            {te('table.zebra')}
          </label>
          <h4 className={label}>{te('columns')}</h4>
          {cols.map((c, i) => (
            <div key={i} className="space-y-1.5 rounded-lg border border-slate-200 p-2 dark:border-gray-800">
              <Input
                aria-label={te('columnLabel')}
                placeholder={te('columnLabel')}
                value={c.label}
                onChange={(e) => setCols(cols.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <div className="flex items-center gap-1.5">
                <select
                  aria-label={te('columnField')}
                  className={selectCls}
                  value={c.key}
                  onChange={(e) => setCols(cols.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}
                >
                  {(catalog.data?.itemColumns ?? [{ key: c.key, label: { en: c.key, ar: c.key } }]).map((k) => (
                    <option key={k.key} value={k.key}>
                      {k.label[lang]}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={te('align')}
                  className={selectCls}
                  value={c.align ?? 'start'}
                  onChange={(e) =>
                    setCols(cols.map((x, j) => (j === i ? { ...x, align: e.target.value as 'start' | 'center' } : x)))
                  }
                >
                  <option value="start">{te('alignStart')}</option>
                  <option value="center">{te('alignCenter')}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#0C447C]"
                  checked={c.bold === true}
                  onChange={(e) => setCols(cols.map((x, j) => (j === i ? { ...x, bold: e.target.checked } : x)))}
                />
                {te('table.bold')}
              </label>
              <div className="flex items-center gap-2">
                <label className={label}>{te('table.width')}</label>
                <Input
                  className="h-8 w-20"
                  type="number"
                  min={5}
                  max={100}
                  placeholder="auto"
                  value={c.width ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value
                    const n = Number(raw)
                    setCols(
                      cols.map((x, j) =>
                        j === i ? { ...x, width: raw === '' || !Number.isFinite(n) ? undefined : Math.min(100, Math.max(5, n)) } : x,
                      ),
                    )
                  }}
                />
              </div>
              <div className="flex justify-end gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={i === 0}
                  aria-label={te('moveUp')}
                  onClick={() => {
                    const n = [...cols]
                    ;[n[i - 1], n[i]] = [n[i], n[i - 1]]
                    setCols(n)
                  }}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={i === cols.length - 1}
                  aria-label={te('moveDown')}
                  onClick={() => {
                    const n = [...cols]
                    ;[n[i + 1], n[i]] = [n[i], n[i + 1]]
                    setCols(n)
                  }}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={cols.length <= 1}
                  aria-label={te('remove')}
                  onClick={() => setCols(cols.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4 text-posCloud-danger" />
                </Button>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setCols([...cols, { key: 'name', label: '' }])}>
            <Plus className="h-4 w-4" />
            {te('addColumn')}
          </Button>
        </section>
      )}
    </div>
  )
}
