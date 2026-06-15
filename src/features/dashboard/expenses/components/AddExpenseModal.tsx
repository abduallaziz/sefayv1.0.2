'use client'

import { useState } from 'react'
import { useCreateExpense, useExpenseCategories } from '../hooks/useExpenses'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

interface Props {
  onClose: () => void
}

export function AddExpenseModal({ onClose }: Props) {
  const { user } = useAuthStore()
  const { data: categories = [] } = useExpenseCategories()
  const mutation = useCreateExpense()

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.get('/branches') as any,
    enabled: !!user,
  })

  const branchId = user?.branchId ?? (branches as any)?.[0]?.id ?? ''

  const [form, setForm] = useState({
    category_id: '',
    amount: '',
    description: '',
  })

  function handleSubmit() {
    if (!form.category_id || !form.amount || !branchId) return
    mutation.mutate({
      branch_id: branchId,
      category_id: form.category_id,
      amount: parseFloat(form.amount),
      description: form.description || undefined,
      type: 'one_time',
    }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">إضافة مصروف</h2>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">الفئة <span className="text-red-400">*</span></label>
          <select
            value={form.category_id}
            onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
            className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">— اختر الفئة —</option>
            {categories.filter(c => c.is_active).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">المبلغ <span className="text-red-400">*</span></label>
          <input
            type="text" inputMode="decimal" placeholder="0.00"
            value={form.amount}
            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
            className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">الوصف (اختياري)</label>
          <input
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="سبب المصروف..."
            className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">أضيف بواسطة</label>
          <div className="px-3 py-2 text-sm bg-[#0d1117] border border-[#1e2130] text-slate-500 rounded-lg">
            {user?.name ?? '—'}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 border border-[#1e2130] text-slate-400 hover:text-white rounded-lg text-sm">
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.category_id || !form.amount || mutation.isPending}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {mutation.isPending ? '...' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  )
}