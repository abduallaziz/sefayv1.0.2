'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Copy, FileText, Plus, Star, Stamp, Trash2, Archive, Send, Pencil } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState } from '@/shared/ui/empty-state'
import { Modal } from '@/shared/ui/modal'
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { documentsApi } from '../api/documents.api'
import {
  DOCUMENT_TYPES,
  PAPERS,
  type DocumentType,
  type Orientation,
  type Paper,
  type TemplateStatus,
  type TemplateSummary,
} from '../types'

const STATUS_TONE: Record<TemplateStatus, StatusTone> = { draft: 'warning', published: 'success', archived: 'neutral' }
const selectCls =
  'h-10 rounded border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40'
const labelCls = 'text-xs font-medium text-slate-600 dark:text-gray-400'

export function TemplatesListPage() {
  const t = useTranslations('documents')
  const router = useRouter()
  const qc = useQueryClient()
  const [docType, setDocType] = useState('')
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)
  const [toDelete, setToDelete] = useState<TemplateSummary | null>(null)

  const enabled = useQuery({ queryKey: ['documents', 'enabled'], queryFn: documentsApi.enabled })
  const list = useQuery({
    queryKey: ['documents', 'templates', docType, status],
    queryFn: () => documentsApi.list({ docType: docType || undefined, status: status || undefined }),
    enabled: enabled.data?.enabled === true,
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['documents', 'templates'] })
  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : t('failed'))
  const useAct = (fn: (id: string) => Promise<unknown>, ok: string) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => {
        toast.success(ok)
        refresh()
      },
      onError: fail,
    })
  const publishM = useAct(documentsApi.publish, t('published'))
  const archiveM = useAct(documentsApi.archive, t('archived'))
  const defaultM = useAct(documentsApi.setDefault, t('defaultSet'))
  const dupM = useAct(documentsApi.duplicate, t('duplicated'))
  const deleteM = useAct((id) => documentsApi.remove(id), t('deleted'))

  if (enabled.isSuccess && !enabled.data.enabled) {
    return (
      <div className="p-6">
        <EmptyState icon={FileText} title={t('title')} description={t('enableHint')} />
      </div>
    )
  }

  return (
    <div className="space-y-5 p-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings/documents/assets">
                <Stamp className="h-4 w-4" />
                {t('assetsLibrary')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings/documents/generated">
                <FileText className="h-4 w-4" />
                {t('generated.title')}
              </Link>
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              {t('newTemplate')}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3">
        <select className={selectCls} value={docType} onChange={(e) => setDocType(e.target.value)} aria-label={t('docType')}>
          <option value="">{t('allTypes')}</option>
          {DOCUMENT_TYPES.map((d) => (
            <option key={d} value={d}>
              {t(`type.${d}`)}
            </option>
          ))}
        </select>
        <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('allStatuses')}>
          <option value="">{t('allStatuses')}</option>
          {(['draft', 'published', 'archived'] as TemplateStatus[]).map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {list.data && list.data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('empty')}
          description={t('emptyHint')}
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              {t('newTemplate')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.data?.map((tpl) => (
            <article
              key={tpl.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-white">{tpl.name}</h3>
                  <p className="text-xs text-slate-500">
                    {t(`type.${tpl.doc_type}`)} · {tpl.paper}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {tpl.is_default && <StatusBadge label={t('default')} tone="brand" />}
                  <StatusBadge label={t(`status.${tpl.status}`)} tone={STATUS_TONE[tpl.status]} />
                </div>
              </div>
              <div className="mt-auto flex flex-wrap gap-1.5">
                <Button size="sm" onClick={() => router.push(`/dashboard/settings/documents/${tpl.id}`)}>
                  <Pencil className="h-3.5 w-3.5" />
                  {t('editor.inspector')}
                </Button>
                {tpl.status !== 'archived' && (
                  <Button size="sm" variant="outline" onClick={() => publishM.mutate(tpl.id)}>
                    <Send className="h-3.5 w-3.5" />
                    {t('publish')}
                  </Button>
                )}
                {tpl.status === 'published' && !tpl.is_default && (
                  <Button size="sm" variant="outline" onClick={() => defaultM.mutate(tpl.id)}>
                    <Star className="h-3.5 w-3.5" />
                    {t('setDefault')}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => dupM.mutate(tpl.id)} aria-label={t('duplicate')} title={t('duplicate')}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                {tpl.status !== 'archived' && (
                  <Button size="sm" variant="ghost" onClick={() => archiveM.mutate(tpl.id)} aria-label={t('archive')} title={t('archive')}>
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setToDelete(tpl)} aria-label={t('delete')} title={t('delete')}>
                  <Trash2 className="h-3.5 w-3.5 text-posCloud-danger" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <CreateDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(id) => {
          setCreating(false)
          refresh()
          router.push(`/dashboard/settings/documents/${id}`)
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteM.mutate(toDelete.id)
          setToDelete(null)
        }}
        title={t('delete')}
        message={t('deleteConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </div>
  )
}

function CreateDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const t = useTranslations('documents')
  const [name, setName] = useState('')
  const [docType, setDocType] = useState<DocumentType>('quotation')
  const [paper, setPaper] = useState<Paper>('A4')
  const [orientation, setOrientation] = useState<Orientation>('portrait')

  const m = useMutation({
    mutationFn: () => documentsApi.create({ name: name.trim(), doc_type: docType, paper, orientation }),
    onSuccess: (r) => {
      toast.success(t('created'))
      setName('')
      onCreated(r.id)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t('failed')),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('newTemplate')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button disabled={!name.trim() || m.isPending} onClick={() => m.mutate()}>
            {t('create')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className={labelCls}>{t('name')}</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelCls}>{t('docType')}</label>
            <select className={`${selectCls} w-full`} value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)}>
              {DOCUMENT_TYPES.map((d) => (
                <option key={d} value={d}>
                  {t(`type.${d}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{t('paper')}</label>
            <select className={`${selectCls} w-full`} value={paper} onChange={(e) => setPaper(e.target.value as Paper)}>
              {PAPERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>{t('orientation')}</label>
          <select
            className={`${selectCls} w-full`}
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as Orientation)}
          >
            <option value="portrait">{t('portrait')}</option>
            <option value="landscape">{t('landscape')}</option>
          </select>
        </div>
      </div>
    </Modal>
  )
}
