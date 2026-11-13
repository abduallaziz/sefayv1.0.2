'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Archive, ArrowLeft, Eye, FileUp, ImageIcon, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState } from '@/shared/ui/empty-state'
import { Modal } from '@/shared/ui/modal'
import { StatusBadge } from '@/shared/ui/status-badge'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { documentsApi } from '../api/documents.api'
import { ASSET_CATEGORIES, type AssetCategory, type DocumentAsset } from '../types'

const selectCls =
  'h-10 w-full rounded border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40'
const labelCls = 'text-xs font-medium text-slate-600 dark:text-gray-400'
const MAX_BYTES = 5 * 1024 * 1024

export function AssetsPage() {
  const t = useTranslations('documents')
  const ta = useTranslations('documents.assetsPage')
  const qc = useQueryClient()
  const [category, setCategory] = useState('')
  const [uploading, setUploading] = useState(false)
  const [toDelete, setToDelete] = useState<DocumentAsset | null>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const [replaceId, setReplaceId] = useState<string | null>(null)

  const enabled = useQuery({ queryKey: ['documents', 'enabled'], queryFn: documentsApi.enabled })
  const list = useQuery({
    queryKey: ['documents', 'assets', 'all', category],
    queryFn: () => documentsApi.assets({ category: category || undefined }),
    enabled: enabled.data?.enabled === true,
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['documents', 'assets'] })
  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : t('failed'))

  const archiveM = useMutation({
    mutationFn: (a: DocumentAsset) => documentsApi.updateAsset(a.id, { status: a.status === 'active' ? 'archived' : 'active' }),
    onSuccess: refresh,
    onError: fail,
  })
  const deleteM = useMutation({
    mutationFn: (id: string) => documentsApi.removeAsset(id),
    onSuccess: () => {
      toast.success(ta('deleted'))
      refresh()
    },
    onError: fail,
  })
  const replaceM = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => documentsApi.replaceAssetFile(id, file),
    onSuccess: () => {
      toast.success(ta('replaced'))
      refresh()
    },
    onError: fail,
  })

  const preview = async (id: string) => {
    try {
      const r = await documentsApi.assetUrl(id)
      window.open(r.url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      fail(e)
    }
  }

  if (enabled.isSuccess && !enabled.data.enabled) {
    return (
      <div className="p-6">
        <EmptyState icon={ImageIcon} title={t('assetsLibrary')} description={t('enableHint')} />
      </div>
    )
  }

  return (
    <div className="space-y-5 p-6">
      <PageHeader
        title={t('assetsLibrary')}
        description={ta('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings/documents">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {t('title')}
              </Link>
            </Button>
            <Button onClick={() => setUploading(true)}>
              <Plus className="h-4 w-4" />
              {ta('upload')}
            </Button>
          </div>
        }
      />

      <select className={`${selectCls} max-w-xs`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label={ta('category')}>
        <option value="">{ta('allCategories')}</option>
        {ASSET_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {ta(`cat.${c}`)}
          </option>
        ))}
      </select>

      <p className="rounded-lg bg-[#E8F1FB] px-3 py-2 text-xs text-[#0C447C] dark:bg-[#0C447C]/20 dark:text-[#9CC4EE]">{ta('privacy')}</p>

      <input
        ref={replaceInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f || !replaceId) return
          if (f.size > MAX_BYTES) return toast.error(ta('tooLarge'))
          replaceM.mutate({ id: replaceId, file: f })
        }}
      />

      {list.data && list.data.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={ta('empty')}
          description={ta('emptyHint')}
          action={
            <Button onClick={() => setUploading(true)}>
              <FileUp className="h-4 w-4" />
              {ta('upload')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.data?.map((a) => (
            <article key={a.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-white">{a.name}</h3>
                  <p className="text-xs text-slate-500">
                    {ta(`cat.${a.category}`)}
                    {a.width_px && a.height_px ? ` · ${a.width_px}×${a.height_px}px` : ''}
                  </p>
                </div>
                <StatusBadge label={ta(`status.${a.status}`)} tone={a.status === 'active' ? 'success' : 'neutral'} />
              </div>
              <div className="mt-auto flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => void preview(a.id)}>
                  <Eye className="h-3.5 w-3.5" />
                  {t('preview')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplaceId(a.id)
                    replaceInput.current?.click()
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {ta('replace')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => archiveM.mutate(a)} aria-label={t('archive')} title={t('archive')}>
                  <Archive className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setToDelete(a)} aria-label={t('delete')} title={t('delete')}>
                  <Trash2 className="h-3.5 w-3.5 text-posCloud-danger" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <UploadDialog
        open={uploading}
        onClose={() => setUploading(false)}
        onDone={() => {
          setUploading(false)
          refresh()
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
        message={ta('deleteConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </div>
  )
}

function UploadDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const t = useTranslations('documents')
  const ta = useTranslations('documents.assetsPage')
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<AssetCategory>('company_stamp')

  const m = useMutation({
    mutationFn: () => documentsApi.uploadAsset({ file: file as File, name: name.trim(), category }),
    onSuccess: () => {
      toast.success(ta('uploaded'))
      setFile(null)
      setName('')
      onDone()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t('failed')),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={ta('upload')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button disabled={!file || !name.trim() || m.isPending} onClick={() => m.mutate()}>
            {ta('upload')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className={labelCls}>{ta('file')}</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-[#E8F1FB] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#0C447C]"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              if (f && f.size > MAX_BYTES) {
                toast.error(ta('tooLarge'))
                e.target.value = ''
                return
              }
              setFile(f)
              if (f && !name) setName(f.name.replace(/\.[^.]+$/, ''))
            }}
          />
          <p className="text-xs text-slate-500">{ta('fileHint')}</p>
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>{t('name')}</label>
          <Input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>{ta('category')}</label>
          <select className={selectCls} value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)}>
            {ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {ta(`cat.${c}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  )
}
