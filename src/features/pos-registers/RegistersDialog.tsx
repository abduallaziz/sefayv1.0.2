'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Monitor, Plus, Power, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/shared/ui/sheet'
import { Button } from '@/shared/ui/button'
import { cn } from '@/lib/utils'
import { useRegisters, useRegisterMutations } from './hooks'

/** Owner/manager management of a branch's POS registers (صناديق): add, rename-by-recreate, toggle, delete. */
export function RegistersDialog({
  branchId,
  branchName,
  open,
  onOpenChange,
}: {
  branchId: string
  branchName: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const t = useTranslations('registers')
  const { data: registers, isLoading } = useRegisters(branchId, open)
  const { create, update, remove } = useRegisterMutations(branchId)
  const [name, setName] = useState('')

  const add = async () => {
    const n = name.trim()
    if (!n) return
    try {
      await create.mutateAsync({ branch_id: branchId, name: n })
      setName('')
    } catch {
      /* central toast */
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent side="end" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Monitor className="h-4 w-4" /> {t('title')} — {branchName}
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
            {t('hint')}
          </p>

          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder={t('namePlaceholder')}
              maxLength={60}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-posCloudDark-border dark:bg-white/[0.02]"
            />
            <Button size="sm" onClick={add} disabled={!name.trim() || create.isPending} className="rounded-lg">
              <Plus className="h-4 w-4" /> {t('add')}
            </Button>
          </div>
          {create.isError && (
            <p className="text-xs text-red-600">{t('addFailed')}</p>
          )}

          <div className="space-y-2">
            {isLoading && <p className="text-sm text-posCloud-text-tertiary">…</p>}
            {(registers ?? []).map((r) => (
              <div
                key={r.id}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-lg border p-3',
                  r.is_active
                    ? 'border-slate-200 dark:border-posCloudDark-border'
                    : 'border-slate-100 bg-slate-50/60 opacity-70 dark:border-posCloudDark-border/50',
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                  <Monitor className="h-4 w-4 text-posCloud-text-tertiary" />
                  {r.name}
                  {!r.is_active && (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">{t('inactive')}</span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    title={r.is_active ? t('deactivate') : t('activate')}
                    onClick={() => update.mutate({ id: r.id, is_active: !r.is_active })}
                    className="rounded-md p-1.5 text-posCloud-text-secondary hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title={t('delete')}
                    onClick={() => remove.mutate(r.id)}
                    className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </div>
            ))}
            {!isLoading && (registers ?? []).length === 0 && (
              <p className="text-sm text-posCloud-text-tertiary">{t('empty')}</p>
            )}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
