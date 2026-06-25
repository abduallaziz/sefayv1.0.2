'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCreateExpense, useExpenseCategories } from '../hooks/useExpenses'
import { useCurrentShift } from '@/features/shifts/hooks/useShifts'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

interface Props {
  onClose: () => void
}

export function AddExpenseModal({ onClose }: Props) {
  const t = useTranslations('expenses')
  const { user } = useAuthStore()
  const { data: categories = [] } = useExpenseCategories()
  const { data: currentShift } = useCurrentShift()
  const mutation = useCreateExpense()

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.get('/branches') as any,
    enabled: !!user,
  })

  const branchId = user?.branchId ?? (branches as any)?.[0]?.id ?? ''

  const [form, setForm] = useState({ category_id: '', amount: '', description: '' })

  function handleSubmit() {
    if (!form.category_id || !form.amount || !branchId) return
    mutation.mutate({
      branch_id: branchId,
      category_id: form.category_id,
      amount: parseFloat(form.amount),
      description: form.description || undefined,
      type: 'one_time',
      shift_id: currentShift?.id,
    }, { onSuccess: onClose })
  }

  const inputClass = "w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-[#0C447C]"
  const labelClass = "text-xs text-slate-500 mb-1 block"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-800 dark:text-white">{t('addExpense.title')}</h2>

        <div>
          <label className={labelClass}>{t('addExpense.category')} <span className="text-red-400">*</span></label>
          <select
            value={form.category_id}
            onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
            className={inputClass}
          >
            <option value="">{t('addExpense.selectCategory')}</option>
            {categories.filter(c => c.is_active).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>{t('addExpense.amount')} <span className="text-red-400">*</span></label>
          <input
            type="text" inputMode="decimal" placeholder="0.00"
            value={form.amount}
            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>{t('addExpense.description')}</label>
          <input
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder={t('addExpense.descriptionPlaceholder')}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>{t('addExpense.addedBy')}</label>
          <div className="px-3 py-2 text-sm bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-500 rounded-lg">
            {user?.name ?? '—'}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm">
            {t('actions.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.category_id || !form.amount || mutation.isPending}
            className="flex-1 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {mutation.isPending ? '...' : t('actions.add')}
          </button>
        </div>
      </div>
    </div>
  )
}