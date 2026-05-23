'use client'

import { useTranslations } from 'next-intl'
import { Edit2, Power } from 'lucide-react'
import type { Plan } from '../types/subscription.types'

interface Props {
  plan: Plan
  onEdit: (plan: Plan) => void
  onToggle: (id: string, is_active: boolean) => void
}

export function PlanCard({ plan, onEdit, onToggle }: Props) {
  const t = useTranslations('subscriptions')

  return (
    <div
      className={`relative rounded-xl border p-5 transition-all ${
        plan.is_active
          ? 'border-[#1e2130] bg-[#141720] hover:border-[#2a2f45]'
          : 'border-[#1e2130]/50 bg-[#141720]/50 opacity-60'
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">{plan.name}</h3>
          <span
            className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              plan.is_active
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-500/20 bg-slate-500/10 text-slate-400'
            }`}
          >
            {plan.is_active ? t('plan.active') : t('plan.inactive')}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(plan)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-[#1e2130] hover:text-white"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onToggle(plan.id, !plan.is_active)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-[#1e2130] hover:text-white"
          >
            <Power size={14} />
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[#0f1117] p-3 text-center">
          <p className="text-xs text-slate-500">{t('plan.monthly')}</p>
          <p className="text-lg font-bold text-white">${plan.price_monthly}</p>
        </div>
        <div className="rounded-lg bg-[#0f1117] p-3 text-center">
          <p className="text-xs text-slate-500">{t('plan.yearly')}</p>
          <p className="text-lg font-bold text-emerald-400">${plan.price_yearly}</p>
        </div>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">{t('plan.maxUsers')}</span>
          <span className="text-slate-300">{plan.max_users}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">{t('plan.maxBranches')}</span>
          <span className="text-slate-300">{plan.max_branches}</span>
        </div>
      </div>
    </div>
  )
}
