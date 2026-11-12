'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Tag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { ApiError } from '@/lib/api'
import { useCreateExpenseCategoryV2 } from '../hooks/useExpenseCategories'

/**
 * The one extra control on the expenses page: add a category (name only). The business only needs
 * categories; departments are handled silently behind the scenes.
 */
export function AddCategoryDialog() {
  const t = useTranslations('expensesV2.expensesCore')
  const create = useCreateExpenseCategoryV2()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const submit = () => {
    const value = name.trim()
    if (!value) return
    create.mutate(
      { name: value },
      {
        onSuccess: () => {
          toast.success(t('categorySaved'))
          setName('')
          setOpen(false)
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed'),
      },
    )
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Tag className="h-4 w-4" />
        {t('addCategory')}
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('newCategory')}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm space-y-4 rounded-2xl border border-posCloud-border bg-posCloud-surface p-5 shadow-xl dark:border-posCloudDark-border dark:bg-posCloudDark-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('newCategory')}</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('categoryName')}</label>
              <Input
                autoFocus
                value={name}
                maxLength={100}
                placeholder={t('categoryNamePh')}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
              <Button onClick={submit} disabled={!name.trim() || create.isPending}>{t('save')}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
