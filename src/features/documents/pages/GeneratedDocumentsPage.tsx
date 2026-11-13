'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Copy, FileDown, FilePlus2, FileText, Plus, Trash2, Ban } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState } from '@/shared/ui/empty-state'
import { Modal } from '@/shared/ui/modal'
import { StatusBadge } from '@/shared/ui/status-badge'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'
import { documentsApi } from '../api/documents.api'
import { DOCUMENT_TYPES, ORDER_DOC_TYPES, type DocumentType, type GeneratedDocument, type ManualItemInput } from '../types'

const selectCls =
  'h-10 w-full rounded border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40'
const labelCls = 'text-xs font-medium text-slate-600 dark:text-gray-400'

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function GeneratedDocumentsPage() {
  const t = useTranslations('documents')
  const tg = useTranslations('documents.generated')
  const qc = useQueryClient()
  const [issuing, setIssuing] = useState(false)
  const [toVoid, setToVoid] = useState<GeneratedDocument | null>(null)
  const [voidReason, setVoidReason] = useState('')

  const enabled = useQuery({ queryKey: ['documents', 'enabled'], queryFn: documentsApi.enabled })
  const list = useQuery({
    queryKey: ['documents', 'generated'],
    queryFn: () => documentsApi.generated(),
    enabled: enabled.data?.enabled === true,
  })
  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : t('failed'))

  const voidM = useMutation({
    mutationFn: () => documentsApi.voidDocument((toVoid as GeneratedDocument).id, voidReason.trim()),
    onSuccess: () => {
      toast.success(tg('voided'))
      setToVoid(null)
      setVoidReason('')
      void qc.invalidateQueries({ queryKey: ['documents', 'generated'] })
    },
    onError: fail,
  })

  const pdf = async (d: GeneratedDocument) => {
    try {
      download(await documentsApi.generatedPdf(d.id), `${d.document_number ?? d.id}.pdf`)
    } catch (e) {
      fail(e)
    }
  }

  if (enabled.isSuccess && !enabled.data.enabled) {
    return (
      <div className="p-6">
        <EmptyState icon={FileText} title={tg('title')} description={t('enableHint')} />
      </div>
    )
  }

  return (
    <div className="space-y-5 p-6">
      <PageHeader
        title={tg('title')}
        description={tg('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings/documents">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {tg('back')}
              </Link>
            </Button>
            <Button onClick={() => setIssuing(true)}>
              <FilePlus2 className="h-4 w-4" />
              {tg('issue')}
            </Button>
          </div>
        }
      />

      {list.data && list.data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={tg('empty')}
          description={tg('emptyHint')}
          action={
            <Button onClick={() => setIssuing(true)}>
              <Plus className="h-4 w-4" />
              {tg('issue')}
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-start text-xs text-slate-500 dark:border-gray-800">
                <th className="px-4 py-3 text-start font-medium">{tg('number')}</th>
                <th className="px-4 py-3 text-start font-medium">{tg('type')}</th>
                <th className="px-4 py-3 text-start font-medium">{tg('date')}</th>
                <th className="px-4 py-3 text-start font-medium">{tg('status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.data?.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0 dark:border-gray-800">
                  <td className="px-4 py-3 font-semibold tabular-nums text-slate-800 dark:text-white">{d.document_number ?? '-'}</td>
                  <td className="px-4 py-3">{t(`type.${d.doc_type}`)}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-500">{d.issued_at.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={d.status === 'issued' ? tg('issued') : tg('void')} tone={d.status === 'issued' ? 'success' : 'neutral'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => void pdf(d)}>
                        <FileDown className="h-3.5 w-3.5" />
                        {tg('pdf')}
                      </Button>
                      {d.status === 'issued' && (
                        <Button size="sm" variant="ghost" onClick={() => setToVoid(d)} aria-label={tg('voidAction')} title={tg('voidAction')}>
                          <Ban className="h-3.5 w-3.5 text-posCloud-danger" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <IssueDialog
        open={issuing}
        onClose={() => setIssuing(false)}
        onDone={() => void qc.invalidateQueries({ queryKey: ['documents', 'generated'] })}
      />

      <Modal
        open={!!toVoid}
        onClose={() => setToVoid(null)}
        title={tg('voidTitle')}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setToVoid(null)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" disabled={!voidReason.trim() || voidM.isPending} onClick={() => voidM.mutate()}>
              {tg('voidAction')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-gray-300">{tg('voidHint')}</p>
          <label className={labelCls}>{tg('reason')}</label>
          <Input value={voidReason} maxLength={500} onChange={(e) => setVoidReason(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

function IssueDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const t = useTranslations('documents')
  const tg = useTranslations('documents.generated')
  const [docType, setDocType] = useState<DocumentType>('quotation')
  const [lang, setLang] = useState<'ar' | 'en'>('ar')
  const [templateId, setTemplateId] = useState('')
  const [saleId, setSaleId] = useState('')
  const [customer, setCustomer] = useState('')
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState<string | undefined>(undefined)
  const [items, setItems] = useState<ManualItemInput[]>([{ name: '', quantity: 1, unit_price: 0 }])
  const [result, setResult] = useState<{ id: string; number: string; url: string } | null>(null)

  const isOrder = ORDER_DOC_TYPES.includes(docType)
  const templates = useQuery({
    queryKey: ['documents', 'templates', docType, 'published'],
    queryFn: () => documentsApi.list({ docType, status: 'published' }),
    enabled: open,
  })

  const m = useMutation({
    mutationFn: () =>
      documentsApi.issue({
        doc_type: docType,
        // manual documents carry a free reference; invoices/receipts the sale id
        source_id: isOrder ? saleId.trim() : `manual-${Date.now()}`,
        template_id: templateId || undefined,
        lang,
        input: isOrder
          ? undefined
          : {
              customer: customer.trim() ? { name: customer.trim() } : undefined,
              document: { ...(notes.trim() ? { notes: notes.trim() } : {}), ...(validUntil ? { valid_until: validUntil } : {}) },
              items: items.map((i) => ({
                name: i.name.trim(),
                quantity: Number(i.quantity),
                unit_price: Number(i.unit_price),
                ...(i.discount ? { discount: Number(i.discount) } : {}),
              })),
            },
      }),
    onSuccess: (r) => {
      toast.success(tg('issuedOk'))
      setResult({ id: r.id, number: r.document_number, url: r.verification_url })
      onDone()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t('failed')),
  })

  const valid = isOrder
    ? saleId.trim().length > 0
    : items.length > 0 && items.every((i) => i.name.trim() && Number(i.quantity) > 0 && Number(i.unit_price) >= 0)
  const noTemplate = templates.isSuccess && templates.data.length === 0

  const close = () => {
    setResult(null)
    onClose()
  }
  const setItem = (idx: number, patch: Partial<ManualItemInput>) =>
    setItems((cur) => cur.map((x, i) => (i === idx ? { ...x, ...patch } : x)))

  return (
    <Modal
      open={open}
      onClose={close}
      title={tg('issue')}
      size="xl"
      footer={
        result ? (
          <div className="flex justify-end">
            <Button onClick={close}>{t('back')}</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              {t('cancel')}
            </Button>
            <Button disabled={!valid || noTemplate || m.isPending} onClick={() => m.mutate()}>
              {tg('issue')}
            </Button>
          </div>
        )
      }
    >
      {result ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-posCloud-success">
            {tg('issuedOk')}: <span className="tabular-nums">{result.number}</span>
          </p>
          <div className="space-y-1">
            <label className={labelCls}>{tg('verifyLink')}</label>
            <div className="flex gap-2">
              <Input readOnly dir="ltr" value={result.url} />
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(result.url)
                  toast.success(tg('copied'))
                }}
              >
                <Copy className="h-4 w-4" />
                {tg('copy')}
              </Button>
            </div>
          </div>
          <Button
            onClick={async () => {
              try {
                download(await documentsApi.generatedPdf(result.id), `${result.number}.pdf`)
              } catch (e) {
                toast.error(e instanceof Error ? e.message : t('failed'))
              }
            }}
          >
            <FileDown className="h-4 w-4" />
            {tg('pdf')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className={labelCls}>{t('docType')}</label>
              <select
                className={selectCls}
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value as DocumentType)
                  setTemplateId('')
                }}
              >
                {DOCUMENT_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {t(`type.${d}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>{tg('template')}</label>
              <select className={selectCls} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <option value="">{tg('autoTemplate')}</option>
                {templates.data?.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>{tg('lang')}</label>
              <select className={selectCls} value={lang} onChange={(e) => setLang(e.target.value as 'ar' | 'en')}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          {noTemplate && <p className="text-sm font-medium text-posCloud-warning">{tg('needTemplate')}</p>}

          {isOrder ? (
            <div className="space-y-1.5">
              <label className={labelCls}>{tg('saleId')}</label>
              <Input dir="ltr" value={saleId} onChange={(e) => setSaleId(e.target.value)} />
              <p className="text-xs text-slate-500">{tg('saleHint')}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={labelCls}>{tg('customerName')}</label>
                  <Input value={customer} maxLength={200} onChange={(e) => setCustomer(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>{tg('notes')}</label>
                  <Input value={notes} maxLength={200} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              {docType === 'quotation' && (
                <div className="space-y-1.5">
                  <label className={labelCls}>{t('type.quotation')} - {tg('date')}</label>
                  <SingleDatePicker value={validUntil} onChange={setValidUntil} />
                </div>
              )}
              <section className="space-y-2">
                <h4 className={labelCls}>{tg('items')}</h4>
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_5rem_6rem_5rem_2.5rem] items-end gap-2">
                    <div className="space-y-1">
                      {i === 0 && <label className={labelCls}>{tg('itemName')}</label>}
                      <Input value={it.name} maxLength={200} onChange={(e) => setItem(i, { name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      {i === 0 && <label className={labelCls}>{tg('qty')}</label>}
                      <Input type="number" min={0} step="any" value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1">
                      {i === 0 && <label className={labelCls}>{tg('price')}</label>}
                      <Input type="number" min={0} step="any" value={it.unit_price} onChange={(e) => setItem(i, { unit_price: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1">
                      {i === 0 && <label className={labelCls}>{tg('discount')}</label>}
                      <Input type="number" min={0} step="any" value={it.discount ?? 0} onChange={(e) => setItem(i, { discount: Number(e.target.value) })} />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={items.length <= 1}
                      onClick={() => setItems((cur) => cur.filter((_, j) => j !== i))}
                      aria-label={t('delete')}
                    >
                      <Trash2 className="h-4 w-4 text-posCloud-danger" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => setItems((cur) => [...cur, { name: '', quantity: 1, unit_price: 0 }])}>
                  <Plus className="h-4 w-4" />
                  {tg('addItem')}
                </Button>
                <p className="text-xs text-slate-500">{tg('totalsNote')}</p>
              </section>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
