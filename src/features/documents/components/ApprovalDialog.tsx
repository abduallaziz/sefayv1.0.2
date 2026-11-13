'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { StatusBadge } from '@/shared/ui/status-badge'
import { documentsApi } from '../api/documents.api'
import type { TemplateStatus } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  templateId: string
  templateStatus: TemplateStatus
}

/** Approval of a template that uses stamps / signatures; required before documents can be issued. */
export function ApprovalDialog({ open, onClose, templateId, templateStatus }: Props) {
  const t = useTranslations('documents.approval')
  const tc = useTranslations('documents')
  const qc = useQueryClient()
  const [reason, setReason] = useState('')
  const list = useQuery({
    queryKey: ['documents', 'approvals', templateId],
    queryFn: () => documentsApi.approvals(templateId),
    enabled: open,
  })
  const latest = list.data?.[0]
  const published = templateStatus === 'published'

  const decide = useMutation({
    mutationFn: (decision: 'approved' | 'rejected') =>
      documentsApi.approve({ template_id: templateId, decision, reason: reason.trim() || undefined }),
    onSuccess: () => {
      toast.success(t('done'))
      setReason('')
      void qc.invalidateQueries({ queryKey: ['documents', 'approvals', templateId] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t('noPermission')),
  })

  return (
    <Modal open={open} onClose={onClose} title={t('title')} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-gray-300">{t('hint')}</p>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">{t('current')}:</span>
          {latest ? (
            <StatusBadge label={t(latest.decision)} tone={latest.decision === 'approved' ? 'success' : 'danger'} />
          ) : (
            <StatusBadge label={t('none')} tone="neutral" />
          )}
        </div>

        {!published ? (
          <p className="text-sm font-medium text-posCloud-warning">{t('publishFirst')}</p>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-gray-400">{t('reason')}</label>
            <textarea
              className="min-h-20 w-full rounded border border-posCloud-border bg-posCloud-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-posCloud-primary/40 dark:border-posCloudDark-border dark:bg-posCloudDark-background"
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="success" disabled={decide.isPending} onClick={() => decide.mutate('approved')}>
                {t('approve')}
              </Button>
              <Button variant="destructive" disabled={decide.isPending} onClick={() => decide.mutate('rejected')}>
                {t('reject')}
              </Button>
            </div>
          </div>
        )}

        {list.data && list.data.length > 0 && (
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('history')}</h4>
            <ul className="space-y-1.5">
              {list.data.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-gray-800">
                  <div className="min-w-0">
                    <StatusBadge label={t(a.decision)} tone={a.decision === 'approved' ? 'success' : 'danger'} />
                    {a.reason && <p className="mt-1 text-xs text-slate-500">{a.reason}</p>}
                  </div>
                  <time className="shrink-0 text-xs tabular-nums text-slate-500" dateTime={a.approved_at}>
                    {a.approved_at.slice(0, 16).replace('T', ' ')}
                  </time>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {tc('cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
