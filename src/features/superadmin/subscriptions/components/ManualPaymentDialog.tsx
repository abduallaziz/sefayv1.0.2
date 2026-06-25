'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import type { Plan, ManualPaymentDto } from '../types/subscription.types'

const schema = z.object({
  tenant_id: z.string().min(1),
  plan_id: z.string().min(1),
  billing_cycle: z.enum(['monthly', 'yearly']),
  amount: z.number().min(1),
  note: z.string().optional(),
})

interface Props {
  open: boolean
  plans: Plan[]
  tenants: { id: string; name: string }[]
  onClose: () => void
  onSubmit: (data: ManualPaymentDto) => void
  isLoading?: boolean
}

export function ManualPaymentDialog({ open, plans, tenants, onClose, onSubmit, isLoading }: Props) {
  const t = useTranslations('subscriptions')
  const { register, handleSubmit } = useForm<ManualPaymentDto>({
    resolver: zodResolver(schema) as any,
    defaultValues: { billing_cycle: 'monthly' },
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-slate-200 dark:border-[#1e2130] bg-white dark:bg-[#141720] text-slate-800 dark:text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('payment.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{t('payment.tenant')}</label>
            <select {...register('tenant_id')} className="w-full rounded-lg border border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#0f1117] px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none">
              <option value="">{t('payment.tenantPlaceholder')}</option>
              {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{t('payment.plan')}</label>
              <select {...register('plan_id')} className="w-full rounded-lg border border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#0f1117] px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none">
                <option value="">{t('payment.planPlaceholder')}</option>
                {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{t('payment.interval')}</label>
              <select {...register('billing_cycle')} className="w-full rounded-lg border border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#0f1117] px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none">
                <option value="monthly">{t('interval.monthly')}</option>
                <option value="yearly">{t('interval.yearly')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{t('payment.amount')}</label>
            <Input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              className="border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-500 dark:text-slate-400">{t('payment.note')}</label>
            <Input {...register('note')} placeholder={t('payment.notePlaceholder')} className="border-slate-200 dark:border-[#1e2130] bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-500 dark:text-slate-400">{t('actions.cancel')}</Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500">
              {isLoading ? t('actions.processing') : t('actions.confirm')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}