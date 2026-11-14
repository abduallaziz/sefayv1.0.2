'use client'

import { useTranslations } from 'next-intl'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Switch } from '@/shared/ui/switch'
import type { InvoiceStyle, InvoiceTemplate } from '@/lib/print/types'

const cardCls = 'rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4'
const labelCls = 'text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary'

const ACCENT_HEX: Record<InvoiceStyle['accent'], string> = {
  black: '#000000', blue: '#0C447C', green: '#157347', red: '#b02a37', purple: '#6f42c1', gray: '#555555',
}

// keys the owner may rename (must match the API's LABEL_KEYS)
const LABEL_KEYS = [
  'invoice', 'date', 'customer', 'vehicle', 'cashier', 'worker', 'subtotal', 'discount',
  'vat', 'total', 'payments', 'cashTendered', 'change', 'notes', 'taxNumber', 'commercialRegister',
] as const

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        active
          ? 'border-[#0C447C] bg-[#E8F1FB] font-semibold text-[#0C447C] dark:bg-[#0C447C]/20 dark:text-[#5B9BD5]'
          : 'border-slate-200 text-slate-500 hover:border-[#0C447C]/50 dark:border-gray-700 dark:text-slate-400'
      }`}
    >
      {children}
    </button>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={labelCls}>{label}</label>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <span className="text-sm text-slate-700 dark:text-white">{label}</span>
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  )
}

/**
 * Designer v2 (invoice): look, language, columns, totals, texts, labels, date format
 * and number format. Legally required parts (seller name, tax number, invoice number,
 * date, VAT, total, QR) have no switch here on purpose: they can be renamed, never hidden.
 */
export function InvoiceStyleSections({
  draft,
  patch,
}: {
  draft: InvoiceTemplate
  patch: (p: Partial<InvoiceTemplate>) => void
}) {
  const t = useTranslations('print.designer.v2')
  const tl = useTranslations('print.designer.v2.labelNames')
  const tn = useTranslations('print.designer.v2.accentNames')
  const st = draft.style
  const setStyle = (p: Partial<InvoiceStyle>) => patch({ style: { ...st, ...p } })
  const fields = draft.custom_fields ?? []

  const setField = (i: number, key: 'label' | 'value', v: string) =>
    patch({ custom_fields: fields.map((f, idx) => (idx === i ? { ...f, [key]: v } : f)) })

  return (
    <>
      <div className={cardCls}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('lookTitle')}</h2>
        <Row label={t('language')}>
          {(['auto', 'ar', 'en', 'bilingual'] as const).map((v) => (
            <Choice key={v} active={draft.language === v} onClick={() => patch({ language: v })}>{t(`lang.${v}`)}</Choice>
          ))}
        </Row>
        <Row label={t('fontSize')}>
          {(['sm', 'md', 'lg'] as const).map((v) => (
            <Choice key={v} active={st.font_size === v} onClick={() => setStyle({ font_size: v })}>{t(`size.${v}`)}</Choice>
          ))}
        </Row>
        <Row label={t('fontWeight')}>
          {(['normal', 'bold_totals'] as const).map((v) => (
            <Choice key={v} active={st.font_weight === v} onClick={() => setStyle({ font_weight: v })}>{t(`weight.${v}`)}</Choice>
          ))}
        </Row>
        <Row label={t('align')}>
          {(['center', 'start'] as const).map((v) => (
            <Choice key={v} active={st.align === v} onClick={() => setStyle({ align: v })}>{t(`alignOpt.${v}`)}</Choice>
          ))}
        </Row>
        <Row label={t('lineSpacing')}>
          {(['compact', 'normal', 'relaxed'] as const).map((v) => (
            <Choice key={v} active={st.line_spacing === v} onClick={() => setStyle({ line_spacing: v })}>{t(`spacing.${v}`)}</Choice>
          ))}
        </Row>
        <Row label={t('separators')}>
          {(['dashed', 'solid', 'none'] as const).map((v) => (
            <Choice key={v} active={st.separators === v} onClick={() => setStyle({ separators: v })}>{t(`sep.${v}`)}</Choice>
          ))}
        </Row>
        <Row label={t('headerLayout')}>
          {(['logo_top', 'logo_side', 'text_only'] as const).map((v) => (
            <Choice key={v} active={st.header_layout === v} onClick={() => setStyle({ header_layout: v })}>{t(`layout.${v}`)}</Choice>
          ))}
        </Row>
        <Row label={t('accent')}>
          {(Object.keys(ACCENT_HEX) as InvoiceStyle['accent'][]).map((v) => (
            <button
              key={v}
              type="button"
              aria-label={tn(v)}
              onClick={() => setStyle({ accent: v })}
              className={`h-8 w-8 rounded-full border-2 ${st.accent === v ? 'border-[#0C447C] ring-2 ring-[#0C447C]/30' : 'border-slate-200 dark:border-gray-700'}`}
              style={{ background: ACCENT_HEX[v] }}
            />
          ))}
        </Row>
      </div>

      <div className={cardCls}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('contentTitle')}</h2>
        <p className="text-[11px] text-slate-400">{t('requiredNote')}</p>
        <Toggle label={t('col.variant')} checked={draft.item_columns.variant} onChange={(v) => patch({ item_columns: { ...draft.item_columns, variant: v } })} />
        <Toggle label={t('col.qty')} checked={draft.item_columns.qty} onChange={(v) => patch({ item_columns: { ...draft.item_columns, qty: v } })} />
        <Toggle label={t('col.unitPrice')} checked={draft.item_columns.unit_price} onChange={(v) => patch({ item_columns: { ...draft.item_columns, unit_price: v } })} />
        <Toggle label={t('line.subtotal')} checked={draft.totals_lines.subtotal} onChange={(v) => patch({ totals_lines: { ...draft.totals_lines, subtotal: v } })} />
        <Toggle label={t('line.discount')} checked={draft.totals_lines.discount} onChange={(v) => patch({ totals_lines: { ...draft.totals_lines, discount: v } })} />
      </div>

      <div className={cardCls}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('textsTitle')}</h2>
        <div className="space-y-1.5">
          <label className={labelCls}>{t('invoiceTitleField')}</label>
          <Input value={draft.title ?? ''} maxLength={60} placeholder={t('invoiceTitlePh')} onChange={(e) => patch({ title: e.target.value || null })} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>{t('headerText')}</label>
          <Input value={draft.header_text ?? ''} maxLength={200} onChange={(e) => patch({ header_text: e.target.value || null })} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>{t('termsText')}</label>
          <Input value={draft.terms_text ?? ''} maxLength={300} placeholder={t('termsPh')} onChange={(e) => patch({ terms_text: e.target.value || null })} />
        </div>

        <div className="space-y-2">
          <label className={labelCls}>{t('customFields')}</label>
          {fields.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={f.label} maxLength={40} placeholder={t('fieldLabel')} onChange={(e) => setField(i, 'label', e.target.value)} />
              <Input value={f.value} maxLength={120} placeholder={t('fieldValue')} onChange={(e) => setField(i, 'value', e.target.value)} />
              <Button type="button" variant="outline" size="sm" aria-label={t('removeField')} onClick={() => patch({ custom_fields: fields.filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {fields.length < 5 && (
            <Button type="button" variant="outline" size="sm" onClick={() => patch({ custom_fields: [...fields, { label: '', value: '' }] })}>
              <Plus className="h-3.5 w-3.5" />
              {t('addField')}
            </Button>
          )}
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('formatsTitle')}</h2>
        <Row label={t('dateFormat')}>
          {(['mdy', 'dmy', 'ymd'] as const).map((v) => (
            <Choice key={v} active={draft.date_format === v} onClick={() => patch({ date_format: v })}>{t(`date.${v}`)}</Choice>
          ))}
        </Row>
        <Row label={t('timeFormat')}>
          {(['12h', '24h'] as const).map((v) => (
            <Choice key={v} active={draft.time_format === v} onClick={() => patch({ time_format: v })}>{t(`time.${v}`)}</Choice>
          ))}
        </Row>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelCls}>{t('numberPrefix')}</label>
            <Input
              value={draft.invoice_number.prefix}
              maxLength={10}
              onChange={(e) => patch({ invoice_number: { ...draft.invoice_number, prefix: e.target.value.replace(/[^A-Za-z0-9\-_/]/g, '') } })}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('numberPadding')}</label>
            <Input
              type="number"
              min={3}
              max={10}
              value={draft.invoice_number.padding}
              onChange={(e) => patch({ invoice_number: { ...draft.invoice_number, padding: Math.min(10, Math.max(3, Math.round(Number(e.target.value)) || 6)) } })}
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-400">{t('numberHint', { example: `${draft.invoice_number.prefix}${'1'.padStart(draft.invoice_number.padding, '0')}` })}</p>
      </div>

      <details className={cardCls}>
        <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-white">{t('labelsTitle')}</summary>
        <p className="mt-2 text-[11px] text-slate-400">{t('labelsHint')}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {LABEL_KEYS.map((k) => (
            <div key={k} className="space-y-1.5">
              <label className={labelCls}>{tl(k)}</label>
              <Input
                value={draft.labels?.[k] ?? ''}
                maxLength={40}
                onChange={(e) => {
                  const next = { ...(draft.labels ?? {}) }
                  if (e.target.value.trim()) next[k] = e.target.value
                  else delete next[k]
                  patch({ labels: next })
                }}
              />
            </div>
          ))}
        </div>
      </details>
    </>
  )
}
