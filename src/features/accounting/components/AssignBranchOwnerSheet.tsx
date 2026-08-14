'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@/shared/ui/sheet'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'
import { useBranches } from '@/shared/hooks/useBranches'
import { useAccountingOwners, useAssignBranchAccountingOwner } from '../hooks/useAccountingConfig'
import { ApiError } from '@/lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const inputClass =
  'w-full border border-posCloud-border dark:border-posCloudDark-border rounded-lg px-3 py-2 text-sm bg-posCloud-surface dark:bg-posCloudDark-surface text-posCloud-text-primary dark:text-posCloudDark-text-primary focus:outline-none focus:border-posCloud-primary'

export function AssignBranchOwnerSheet({ open, onOpenChange }: Props) {
  const t = useTranslations('accounting.configuration.assignForm')

  const { data: branches } = useBranches()
  const owners = useAccountingOwners(open)
  const assign = useAssignBranchAccountingOwner()

  const [branchId, setBranchId] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState<string | undefined>(undefined)
  const [reason, setReason] = useState('')

  const canSubmit = !!branchId && !!ownerId && !!effectiveFrom

  const handleSubmit = () => {
    if (!canSubmit) return
    assign.mutate(
      { branch_id: branchId, accounting_owner_id: ownerId, effective_from: effectiveFrom as string, reason: reason || undefined },
      {
        onSuccess: () => {
          toast.success(t('success'))
          setBranchId('')
          setOwnerId('')
          setEffectiveFrom(undefined)
          setReason('')
          onOpenChange(false)
        },
        onError: (err) => {
          const message = err instanceof ApiError ? err.message : t('error')
          toast.error(message)
        },
      },
    )
  }

  return (
    // modal={false}: SingleDatePicker's calendar portals to document.body,
    // outside this Sheet's own DOM subtree. Radix's default modal focus
    // trap fights clicks on anything portaled outside its content, which
    // silently ate every day-button click. Scoped to this Sheet usage only
    // (Sheet/SingleDatePicker themselves are untouched) — every other Sheet
    // in the app keeps the default modal trap.
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent side="end">
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('branch')}</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={inputClass}>
              <option value="">{t('selectBranch')}</option>
              {(branches ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('owner')}</label>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inputClass}>
              <option value="">{t('selectOwner')}</option>
              {(owners.data ?? []).map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('effectiveFrom')}</label>
            <SingleDatePicker value={effectiveFrom} onChange={setEffectiveFrom} placeholder={t('selectDate')} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('reason')}</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
              className={inputClass}
            />
          </div>
        </SheetBody>

        <SheetFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary hover:bg-posCloud-background dark:hover:bg-posCloudDark-background"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || assign.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-posCloud-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assign.isPending ? t('submitting') : t('submit')}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
