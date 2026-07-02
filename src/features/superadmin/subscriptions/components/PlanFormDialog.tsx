'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import type { Plan, CreatePlanDto } from '../types/subscription.types'

const schema = z.object({
  name: z.string().min(2),
  price_monthly: z.number().min(0),
  price_yearly: z.number().min(0),
  max_users: z.number().min(1),
  max_branches: z.number().min(1),
})

interface Props {
  open: boolean
  plan?: Plan | null
  onClose: () => void
  onSubmit: (data: CreatePlanDto) => void
  isLoading?: boolean
}

export function PlanFormDialog({ open, plan, onClose, onSubmit, isLoading }: Props) {
  const t = useTranslations('subscriptions')
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreatePlanDto>({
    resolver: zodResolver(schema) as any,
  })

  useEffect(() => {
    if (plan) {
      reset({ name: plan.name, price_monthly: plan.price_monthly, price_yearly: plan.price_yearly, max_users: plan.max_users, max_branches: plan.max_branches })
    } else {
      reset({ name: '', price_monthly: 0, price_yearly: 0, max_users: 5, max_branches: 1 })
    }
  }, [plan, reset])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-slate-200 dark:border-[#1e2130] bg-white dark:bg-[#141720] text-slate-800 dark:text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{plan ? t('planForm.titleEdit') : t('planForm.titleCreate')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{t('planForm.name')}</label>
            <Input {...register('name')} placeholder={t('planForm.namePlaceholder')} className="border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-white" />
            {errors.name && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{t('planForm.priceMonthly')}</label>
              <Input {...register('price_monthly', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })} type="text" inputMode="decimal" lang="en" dir="ltr" className="border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{t('planForm.priceYearly')}</label>
              <Input {...register('price_yearly', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })} type="text" inputMode="decimal" lang="en" dir="ltr" className="border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{t('planForm.maxUsers')}</label>
              <Input {...register('max_users', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })} type="text" inputMode="numeric" lang="en" dir="ltr" className="border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{t('planForm.maxBranches')}</label>
              <Input {...register('max_branches', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })} type="text" inputMode="numeric" lang="en" dir="ltr" className="border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-500 dark:text-slate-400">{t('actions.cancel')}</Button>
            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500">
              {isLoading ? t('actions.saving') : plan ? t('actions.save') : t('actions.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}