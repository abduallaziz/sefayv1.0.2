'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { ApiError } from '@/lib/api'
import { useBranchContext } from '@/core/branch/useBranchContext'
import { usePublishToBranches } from '../hooks/useBranchesAdmin'
import type { PublishMode, PublishResult } from '../api/branches.api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Registry type, e.g. 'items', 'coupons', 'shift_patterns' (GET /branches/publish/types). */
  entityType: string
  sourceIds: string[]
}

/** Reusable "publish to branches" dialog: choose target branches + mode, preview counts, see the result. */
export function PublishToBranchesDialog(props: Props) {
  // Mounted only while open so every opening starts from a clean state.
  return props.open ? <PublishToBranchesDialogInner {...props} /> : null
}

function PublishToBranchesDialogInner({ open, onOpenChange, entityType, sourceIds }: Props) {
  const locale = useLocale()
  const t = useTranslations('branches')
  const { availableBranches, currentBranchId } = useBranchContext()
  const publish = usePublishToBranches()
  const targets = useMemo(
    () => availableBranches.filter((b) => b.id !== currentBranchId),
    [availableBranches, currentBranchId],
  )
  const [selected, setSelected] = useState<string[]>([])
  const [mode, setMode] = useState<PublishMode>('copy_new')
  const [result, setResult] = useState<PublishResult | null>(null)

  const allSelected = targets.length > 0 && selected.length === targets.length
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const run = () => {
    if (!selected.length || publish.isPending) return
    publish.mutate(
      {
        entity_type: entityType,
        source_ids: sourceIds,
        target_branch_ids: allSelected ? 'all' : selected,
        mode,
      },
      {
        onSuccess: (res) => {
          setResult(res)
          toast.success(t('publishDone'))
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : t('publishError')),
      },
    )
  }

  const nums = (n: number) => String(n)
  const muted = 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('publishTitle')}</DialogTitle>
          <DialogDescription>{t('publishDescription')}</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="mt-4 space-y-2" aria-live="polite">
            <p className="text-sm font-medium">{t('publishResultTitle')}</p>
            {result.results.map((r) => (
              <div key={r.branch_id} className="rounded-md border border-posCloud-border dark:border-posCloudDark-border p-3 text-sm">
                <div className="font-medium">{r.branch_name}</div>
                <div className={`mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs ${muted}`}>
                  <span>{t('publishCreated')}: {nums(r.created)}</span>
                  <span>{t('publishUpdated')}: {nums(r.updated)}</span>
                  <span>{t('publishSkipped')}: {nums(r.skipped)}</span>
                  {r.failed > 0 && (
                    <span className="text-posCloud-danger">{t('publishFailed')}: {nums(r.failed)}</span>
                  )}
                </div>
                {r.errors.slice(0, 3).map((e) => (
                  <p key={e.source_id} className="mt-1 text-xs text-posCloud-danger">{e.message}</p>
                ))}
              </div>
            ))}
            {entityType === 'items' && result.results.some((r) => r.created > 0) && (
              <p className={`text-xs ${muted}`}>
                {t('publishStockNote')}{' '}
                <Link href={`/${locale}/dashboard/adjustments`} className="font-medium text-[#0C447C] dark:text-[#5B9BD5] hover:underline">
                  {t('publishStockLink')}
                </Link>
              </p>
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={() => onOpenChange(false)}>{t('publishClose')}</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <fieldset className="space-y-2">
              <legend className={`mb-1 text-xs font-medium ${muted}`}>{t('publishTargets')}</legend>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  aria-label={t('publishAll')}
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? [] : targets.map((b) => b.id))}
                />
                {t('publishAll')}
              </label>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {targets.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      aria-label={b.name}
                      checked={selected.includes(b.id)}
                      onChange={() => toggle(b.id)}
                    />
                    {b.name}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className={`mb-1 text-xs font-medium ${muted}`}>{t('publishMode')}</legend>
              {(['copy_new', 'update_existing'] as const).map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="publish-mode" checked={mode === m} onChange={() => setMode(m)} />
                  {m === 'copy_new' ? t('publishModeCopyNew') : t('publishModeUpdate')}
                </label>
              ))}
            </fieldset>

            <p className={`text-xs ${muted}`}>
              {selected.length
                ? t('publishPreview', { records: nums(sourceIds.length), branches: nums(selected.length) })
                : t('publishNoTargets')}
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={run} disabled={!selected.length || publish.isPending}>
                {t('publishRun')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
