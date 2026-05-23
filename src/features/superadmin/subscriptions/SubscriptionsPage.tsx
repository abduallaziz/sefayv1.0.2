'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, CreditCard, Search } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { PlanCard } from './components/PlanCard'
import { PlanFormDialog } from './components/PlanFormDialog'
import { ManualPaymentDialog } from './components/ManualPaymentDialog'
import { SubscriptionsTable } from './components/SubscriptionsTable'
import {
  useSubscriptions, usePlans, useCreatePlan, useUpdatePlan,
  useTogglePlan, useCancelSubscription, useManualPayment,
} from './hooks/useSubscriptions'
import type { Plan, CreatePlanDto, ManualPaymentDto } from './types/subscription.types'

export function SubscriptionsPage() {
  const t = useTranslations('subscriptions')
  const [tab, setTab] = useState<'subscriptions' | 'plans'>('subscriptions')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planDialog, setPlanDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [paymentDialog, setPaymentDialog] = useState(false)

  const { data: subscriptions = [], isLoading: loadingSubs } = useSubscriptions({ search: search || undefined, status: statusFilter || undefined })
  const { data: plans = [], isLoading: loadingPlans } = usePlans()
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()
  const togglePlan = useTogglePlan()
  const cancelSub = useCancelSubscription()
  const manualPayment = useManualPayment()

  const tenants = subscriptions.reduce<{ id: string; name: string }[]>((acc, sub) => {
    if (!acc.find((t) => t.id === sub.tenant_id)) acc.push({ id: sub.tenant_id, name: sub.tenant_name })
    return acc
  }, [])

  const handlePlanSubmit = (data: CreatePlanDto) => {
    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, data }, { onSuccess: () => { setPlanDialog(false); setEditingPlan(null) } })
    } else {
      createPlan.mutate(data, { onSuccess: () => setPlanDialog(false) })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">{t('title')}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{t('subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setPaymentDialog(true)} variant="outline" className="gap-2 border-[#1e2130] bg-transparent text-slate-300 hover:bg-[#1e2130]">
            <CreditCard size={15} />{t('actions.manualPayment')}
          </Button>
          {tab === 'plans' && (
            <Button onClick={() => { setEditingPlan(null); setPlanDialog(true) }} className="gap-2 bg-indigo-600 hover:bg-indigo-500">
              <Plus size={15} />{t('actions.newPlan')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex w-fit gap-1 rounded-lg border border-[#1e2130] bg-[#141720] p-1">
        {(['subscriptions', 'plans'] as const).map((tabKey) => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === tabKey ? 'bg-[#0f1117] text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
            {t(`tabs.${tabKey}`)}
          </button>
        ))}
      </div>

      {tab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative max-w-sm flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('filters.search')} className="border-[#1e2130] bg-[#141720] pl-9 text-white placeholder:text-slate-600" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-[#1e2130] bg-[#141720] px-3 py-2 text-sm text-slate-300 focus:outline-none">
              <option value="">{t('filters.allStatus')}</option>
              <option value="active">{t('status.active')}</option>
              <option value="trial">{t('status.trial')}</option>
              <option value="cancelled">{t('status.cancelled')}</option>
              <option value="expired">{t('status.expired')}</option>
              <option value="suspended">{t('status.suspended')}</option>
            </select>
          </div>
          {loadingSubs ? <div className="py-12 text-center text-slate-500">{t('loading')}</div>
            : <SubscriptionsTable subscriptions={subscriptions} onCancel={(id) => cancelSub.mutate(id)} />}
        </div>
      )}

      {tab === 'plans' && (
        <div>
          {loadingPlans ? <div className="py-12 text-center text-slate-500">{t('loading')}</div>
            : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan}
                    onEdit={(p) => { setEditingPlan(p); setPlanDialog(true) }}
                    onToggle={(id, is_active) => togglePlan.mutate({ id, is_active })} />
                ))}
              </div>
            )}
        </div>
      )}

      <PlanFormDialog open={planDialog} plan={editingPlan}
        onClose={() => { setPlanDialog(false); setEditingPlan(null) }}
        onSubmit={handlePlanSubmit}
        isLoading={createPlan.isPending || updatePlan.isPending} />

      <ManualPaymentDialog open={paymentDialog} plans={plans} tenants={tenants}
        onClose={() => setPaymentDialog(false)}
        onSubmit={(data) => manualPayment.mutate(data, { onSuccess: () => setPaymentDialog(false) })}
        isLoading={manualPayment.isPending} />
    </div>
  )
}