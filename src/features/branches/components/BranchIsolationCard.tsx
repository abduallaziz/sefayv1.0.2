'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Switch } from '@/shared/ui/switch'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { useBranchIsolation, useSetBranchIsolation } from '../hooks/useBranchesAdmin'
import type { BranchRecord } from '../api/branches.api'

// Owner control for branch isolation (docs/DESIGN_BRANCH_ISOLATION.md D1/D2): when on, every branch works as an
// independent business and only the main branch's dashboard shows a summary of the others.
export function BranchIsolationCard({ branches, canManage }: { branches: BranchRecord[]; canManage: boolean }) {
  const t = useTranslations('branches.isolation')
  const { data, isLoading } = useBranchIsolation()
  const setIsolation = useSetBranchIsolation()
  const [pending, setPending] = useState<boolean | null>(null)

  const main = branches.find((b) => b.is_main)
  const enabled = data?.enabled === true

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-start gap-3 text-start">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-posCloud-primary-light text-posCloud-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('title')}</p>
            <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('description')}</p>
            <p className="mt-1 text-xs text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">
              {main ? t('mainIs', { name: main.name }) : t('noMain')}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          disabled={!canManage || isLoading || setIsolation.isPending || (!enabled && !main)}
          onCheckedChange={(v) => setPending(v)}
          aria-label={t('title')}
        />
      </CardContent>
      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={() =>
          setIsolation.mutate(pending === true, {
            onSuccess: () => {
              toast.success(pending ? t('enabledToast') : t('disabledToast'))
              setPending(null)
            },
            onError: () => setPending(null),
          })
        }
        title={pending ? t('enableTitle') : t('disableTitle')}
        message={pending ? t('enableConfirm') : t('disableConfirm')}
        confirmLabel={pending ? t('enable') : t('disable')}
        cancelLabel={t('cancel')}
        variant="warning"
        isLoading={setIsolation.isPending}
      />
    </Card>
  )
}
