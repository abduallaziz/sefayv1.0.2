'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ChevronLeft, Printer, Save, Trash2, Upload } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Switch } from '@/shared/ui/switch'
import { InvoiceStyleSections } from '../components/InvoiceStyleSections'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { printApi, type TemplateResponse } from '@/lib/print/print.api'
import { renderPrintHtml } from '@/lib/print/renderReceipt'
import { printHtml } from '@/lib/print/printReceipt'
import { sampleInvoicePayload, sampleKitchenPayload, type SampleStrings } from '@/lib/print/sample'
import { usePrintLabels, useRenderOptions } from '@/lib/print/usePrinting'
import type { InvoiceTemplate, KitchenTemplate, PaperWidth, TemplateBlock } from '@/lib/print/types'

type Kind = 'invoice' | 'kitchen'
type AnyTemplate = InvoiceTemplate | KitchenTemplate

const PAPERS: PaperWidth[] = ['58mm', '80mm', 'A4']
const PREVIEW_PX: Record<PaperWidth, number> = { '58mm': 230, '80mm': 310, A4: 640 }

const fieldCls = 'space-y-1.5'
const labelCls = 'text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary'
const cardCls =
  'rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4'

export function PrintDesignerPage({ kind }: { kind: Kind }) {
  const t = useTranslations('print.designer')
  const authReady = useAuthStore((s) => !s.isLoading)
  const [branchId, setBranchId] = useState<string>('')

  const query = useQuery({
    queryKey: ['print', 'template', kind, branchId],
    queryFn: () => printApi.getTemplate(kind, branchId || undefined),
    enabled: authReady,
  })

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/settings"
          className="mb-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#0C447C]"
        >
          <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          {t('back')}
        </Link>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
          {kind === 'invoice' ? t('invoiceTitle') : t('kitchenTitle')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {kind === 'invoice' ? t('invoiceSubtitle') : t('kitchenSubtitle')}
        </p>
      </div>

      {query.isError && <p className="text-sm text-red-600">{t('loadFailed')}</p>}
      {query.data && (
        <DesignerForm
          key={`${kind}-${branchId}-${query.dataUpdatedAt}`}
          kind={kind}
          data={query.data as TemplateResponse<AnyTemplate>}
          branchId={branchId}
          onBranchChange={setBranchId}
        />
      )}
    </div>
  )
}

function DesignerForm({
  kind,
  data,
  branchId,
  onBranchChange,
}: {
  kind: Kind
  data: TemplateResponse<AnyTemplate>
  branchId: string
  onBranchChange: (id: string) => void
}) {
  const t = useTranslations('print.designer')
  const tSample = useTranslations('print.sample')
  const locale = useLocale()
  const labels = usePrintLabels()
  const render = useRenderOptions()
  const currency = useCurrencyDisplay()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [draft, setDraft] = useState<AnyTemplate>(data.template)
  const [logoPreview, setLogoPreview] = useState<string | null>(data.logo_url)
  const [uploading, setUploading] = useState(false)
  const inv = kind === 'invoice' ? (draft as InvoiceTemplate) : null
  const kit = kind === 'kitchen' ? (draft as KitchenTemplate) : null

  const patch = (p: Partial<InvoiceTemplate> & Partial<KitchenTemplate>) =>
    setDraft((d) => ({ ...d, ...p }) as AnyTemplate)

  const save = useMutation({
    mutationFn: () =>
      printApi.saveTemplate(kind, draft as never, branchId || undefined) as Promise<TemplateResponse<AnyTemplate>>,
    onSuccess: (res) => {
      qc.setQueryData(['print', 'template', kind, branchId], res)
      toast.success(t('saved'))
    },
    onError: () => toast.error(t('saveFailed')),
  })

  const clearOverride = useMutation({
    mutationFn: () => printApi.clearBranchOverride(kind, branchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['print', 'template', kind] })
      toast.success(t('overrideRemoved'))
    },
    onError: () => toast.error(t('saveFailed')),
  })

  async function onPickLogo(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const res = await printApi.uploadLogo(file)
      patch({ logo_path: res.logo_path, logo_url: null })
      setLogoPreview(res.logo_url)
    } catch {
      toast.error(t('logoFailed'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const blocks = [...draft.blocks]
    const j = index + dir
    if (j < 0 || j >= blocks.length) return
    ;[blocks[index], blocks[j]] = [blocks[j], blocks[index]]
    patch({ blocks })
  }
  function toggleBlock(index: number, visible: boolean) {
    patch({ blocks: draft.blocks.map((b, i) => (i === index ? { ...b, visible } : b)) as TemplateBlock[] })
  }

  const sample: SampleStrings = {
    businessName: tSample('businessName'),
    address: tSample('address'),
    phone: tSample('phone'),
    item1: tSample('item1'),
    item2: tSample('item2'),
    customer: tSample('customer'),
    plate: tSample('plate'),
    cashier: tSample('cashier'),
    worker: tSample('worker'),
    note: tSample('note'),
    footer: tSample('footer'),
    table: tSample('table'),
  }

  const previewHtml = useMemo(() => {
    const payload =
      kind === 'invoice'
        ? sampleInvoicePayload(draft as InvoiceTemplate, data.fallbacks, sample, logoPreview, currency)
        : sampleKitchenPayload(draft as KitchenTemplate, sample, currency)
    return renderPrintHtml(payload, labels, render)
    // sample strings change only with the locale
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, logoPreview, labels, render, locale, currency, kind, data.fallbacks])

  const input = (
    label: string,
    value: string | null,
    onChange: (v: string) => void,
    placeholder?: string | null,
    hint?: string,
  ) => (
    <div className={fieldCls}>
      <label className={labelCls}>{label}</label>
      <Input value={value ?? ''} placeholder={placeholder ?? ''} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,auto)]">
      <div className="space-y-4">
        {/* Scope: tenant default or a branch override */}
        <div className={cardCls}>
          <div className={fieldCls}>
            <label className={labelCls}>{t('scope')}</label>
            <select
              value={branchId}
              onChange={(e) => onBranchChange(e.target.value)}
              className="flex h-10 w-full rounded border border-posCloud-border bg-posCloud-background px-3 text-sm dark:border-posCloudDark-border dark:bg-posCloudDark-background"
            >
              <option value="">{t('scopeAll')}</option>
              {data.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.has_override ? ` (${t('scopeCustom')})` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">{t('scopeHint')}</p>
          </div>
          {branchId && data.has_override && (
            <Button variant="outline" size="sm" onClick={() => clearOverride.mutate()} disabled={clearOverride.isPending}>
              <Trash2 className="h-3.5 w-3.5" />
              {t('removeOverride')}
            </Button>
          )}
        </div>

        {inv && (
          <div className={cardCls}>
            {/* Logo */}
            <div className={fieldCls}>
              <label className={labelCls}>{t('logo')}</label>
              <div className="flex flex-wrap items-center gap-3">
                {(logoPreview ?? inv.logo_url ?? data.fallbacks.logo_url) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(logoPreview ?? inv.logo_url ?? data.fallbacks.logo_url) as string}
                    alt=""
                    className="h-14 max-w-[8rem] rounded border border-slate-200 object-contain p-1 dark:border-gray-700"
                  />
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => onPickLogo(e.target.files?.[0])}
                />
                <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? t('logoUploading') : t('logoUpload')}
                </Button>
                {(inv.logo_path || inv.logo_url) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      patch({ logo_path: null, logo_url: null })
                      setLogoPreview(null)
                    }}
                  >
                    {t('logoRemove')}
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">{t('logoHint')}</p>
            </div>
            <SwitchRow label={t('showLogo')} checked={inv.show_logo} onChange={(v) => patch({ show_logo: v })} />

            {input(t('businessName'), inv.business_name, (v) => patch({ business_name: v || null }), data.fallbacks.business_name, t('usesDefault'))}
            {input(t('address'), inv.address, (v) => patch({ address: v || null }), data.fallbacks.address)}
            {input(t('phone'), inv.phone, (v) => patch({ phone: v || null }), data.fallbacks.phone)}
            {input(t('taxNumber'), inv.tax_number, (v) => patch({ tax_number: v || null }), data.fallbacks.tax_number, t('taxNumberHint'))}
            {input(t('commercialRegister'), inv.commercial_register, (v) => patch({ commercial_register: v || null }))}
            {input(t('footer'), inv.footer, (v) => patch({ footer: v || null }), data.fallbacks.footer)}
          </div>
        )}

        {kit && (
          <div className={cardCls}>
            {input(t('headerText'), kit.header_text, (v) => patch({ header_text: v || null }), null, t('headerTextHint'))}
            <div className={fieldCls}>
              <label className={labelCls}>{t('fontSize')}</label>
              <div className="flex gap-2">
                {(['sm', 'md', 'lg'] as const).map((f) => (
                  <ChoiceButton key={f} active={kit.font_size === f} onClick={() => patch({ font_size: f })}>
                    {t(f === 'sm' ? 'fontSm' : f === 'md' ? 'fontMd' : 'fontLg')}
                  </ChoiceButton>
                ))}
              </div>
            </div>
            <SwitchRow label={t('showItemNotes')} checked={kit.show_item_notes} onChange={(v) => patch({ show_item_notes: v })} />
          </div>
        )}

        <div className={cardCls}>
          <div className={fieldCls}>
            <label className={labelCls}>{t('paperWidth')}</label>
            <div className="flex gap-2">
              {PAPERS.map((p) => (
                <ChoiceButton key={p} active={draft.paper_width === p} onClick={() => patch({ paper_width: p })}>
                  <span dir="ltr">{p}</span>
                </ChoiceButton>
              ))}
            </div>
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>{t('copies')}</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <ChoiceButton key={n} active={draft.copies === n} onClick={() => patch({ copies: n })}>
                  <span dir="ltr">{n}</span>
                </ChoiceButton>
              ))}
            </div>
          </div>
          {inv && (
            <div className="space-y-1">
              <SwitchRow label={t('qr')} checked={inv.qr_enabled} onChange={(v) => patch({ qr_enabled: v })} />
              <p className="text-[11px] text-slate-400">{t('qrHint')}</p>
            </div>
          )}
        </div>

        {/* Sections: show/hide + order */}
        <div className={cardCls}>
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-white">{t('blocks')}</h2>
            <p className="text-[11px] text-slate-400">{t('blocksHint')}</p>
          </div>
          <ul className="space-y-1.5">
            {draft.blocks.map((b, i) => (
              <li
                key={b.key}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-gray-800"
              >
                <Switch checked={b.visible} onCheckedChange={(v) => toggleBlock(i, v)} aria-label={t(`block.${b.key}`)} />
                <span className="flex-1 text-sm">{t(`block.${b.key}`)}</span>
                <button
                  type="button"
                  aria-label={t('moveUp')}
                  disabled={i === 0}
                  onClick={() => moveBlock(i, -1)}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/5"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t('moveDown')}
                  disabled={i === draft.blocks.length - 1}
                  onClick={() => moveBlock(i, 1)}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/5"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {inv && <InvoiceStyleSections draft={inv} patch={patch} />}

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-4 w-4" />
            {save.isPending ? t('saving') : t('save')}
          </Button>
          <Button variant="outline" onClick={() => void printHtml(previewHtml)}>
            <Printer className="h-4 w-4" />
            {t('testPrint')}
          </Button>
        </div>
      </div>

      {/* Live preview: the SAME renderer that prints */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <p className="mb-2 text-xs font-medium text-slate-500">{t('preview')}</p>
        <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-3 dark:border-gray-800 dark:bg-gray-950">
          <iframe
            title={t('preview')}
            sandbox=""
            srcDoc={previewHtml}
            style={{ width: PREVIEW_PX[draft.paper_width], height: 620, background: '#fff', border: 0, display: 'block', margin: '0 auto' }}
          />
        </div>
      </div>
    </div>
  )
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700 dark:text-white">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  )
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
        active
          ? 'border-[#0C447C] bg-[#E8F1FB] font-semibold text-[#0C447C] dark:bg-[#0C447C]/20 dark:text-[#5B9BD5]'
          : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-gray-700 dark:text-gray-300'
      }`}
    >
      {children}
    </button>
  )
}
