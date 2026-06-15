'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Check, X } from 'lucide-react'
import { useExpenseTemplates, useCreateTemplate, useUpdateTemplate } from '../hooks/useExpenses'
import type { ExpenseTemplate } from '../api/expenses.api'

export function ExpenseTemplatesList() {
  const t = useTranslations('expenses')
  const { data: templates = [], isLoading } = useExpenseTemplates()
  const createMutation = useCreateTemplate()
  const updateMutation = useUpdateTemplate()

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', default_amount: '', expiry_hours: '24', requires_photo: false })

  function handleCreate() {
    if (!form.name) return
    createMutation.mutate({
      name: form.name,
      default_amount: form.default_amount ? Number(form.default_amount) : null,
      requires_photo: form.requires_photo,
      expiry_hours: Number(form.expiry_hours) || 24,
      is_active: true,
    }, {
      onSuccess: () => {
        setShowAdd(false)
        setForm({ name: '', default_amount: '', expiry_hours: '24', requires_photo: false })
      }
    })
  }

  function handleToggle(row: ExpenseTemplate) {
    updateMutation.mutate({ id: row.id, dto: { is_active: !row.is_active } })
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('actions.newTemplate')}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-[#141720] rounded-xl animate-pulse" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p>{t('empty.templates')}</p>
        </div>
      ) : (
        <div className="bg-[#141720] border border-[#1e2130] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2130]">
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">{t('template.name')}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">{t('template.defaultAmount')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">{t('template.requiresPhoto')}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">{t('template.expiryHours')}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500">الحالة</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {templates.map((row) => (
                <tr key={row.id} className="border-b border-[#1e2130] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-slate-400">{row.default_amount ? `${row.default_amount} ر.س` : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {row.requires_photo
                      ? <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                      : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{row.expiry_hours} ساعة</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                      row.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {row.is_active ? 'نشط' : 'معطّل'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(row)}
                      className="px-3 py-1 rounded-lg text-xs border border-[#1e2130] text-slate-400 hover:text-white hover:bg-white/5"
                    >
                      {row.is_active ? 'تعطيل' : 'تفعيل'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#0d1117] border border-[#1e2130] rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">{t('actions.newTemplate')}</h2>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('template.name')}</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('template.defaultAmount')} (اختياري)</label>
              <input
                type="text" inputMode="decimal" placeholder="0.00"
                value={form.default_amount}
                onChange={e => setForm(p => ({ ...p, default_amount: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('template.expiryHours')}</label>
              <input
                type="text" inputMode="numeric" placeholder="24"
                value={form.expiry_hours}
                onChange={e => setForm(p => ({ ...p, expiry_hours: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requires_photo}
                onChange={e => setForm(p => ({ ...p, requires_photo: e.target.checked }))}
                className="w-4 h-4 accent-blue-600"
              />
              {t('template.requiresPhoto')}
            </label>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-[#1e2130] text-slate-400 hover:text-white rounded-lg text-sm">
                إلغاء
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name || createMutation.isPending}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {createMutation.isPending ? '...' : 'إنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}