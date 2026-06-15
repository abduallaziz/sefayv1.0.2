'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle, XCircle, Clock, AlertCircle, Plus } from 'lucide-react'
import { useExpenses, useApproveExpense, useRejectExpense, useCreateExpense, useExpenseTemplates } from '../hooks/useExpenses'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import type { Expense, ExpenseStatus } from '../api/expenses.api'
import { formatCurrency } from '@/lib/format'

const statusConfig: Record<ExpenseStatus, { label: string; color: string; icon: any }> = {
  pending:  { label: 'pending',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  icon: Clock },
  approved: { label: 'approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  rejected: { label: 'rejected', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  expired:  { label: 'expired',  color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: AlertCircle },
}

export function ExpenseRequestsList() {
  const t = useTranslations('expenses')
  const { user } = useAuthStore()
  const { data: expenses = [], isLoading } = useExpenses()
  const { data: templates = [] } = useExpenseTemplates()
  const approveMutation = useApproveExpense()
  const rejectMutation = useRejectExpense()
  const createMutation = useCreateExpense()

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.get('/branches') as any,
    enabled: !!user,
  })

  const branchId = user?.branchId ?? (branches as any)?.[0]?.id ?? ''

  const [rejectTarget, setRejectTarget] = useState<Expense | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ amount: '', template_id: '', note: '' })

  function handleApprove(id: string) {
    approveMutation.mutate(id)
  }

  function handleReject() {
    if (!rejectTarget) return
    rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })
    setRejectTarget(null)
    setRejectReason('')
  }

  function handleCreate() {
    if (!addForm.amount || !branchId) return
    createMutation.mutate({
      branch_id: branchId,
      amount: parseFloat(addForm.amount),
      template_id: addForm.template_id || undefined,
      note: addForm.note || undefined,
    }, {
      onSuccess: () => {
        setShowAdd(false)
        setAddForm({ amount: '', template_id: '', note: '' })
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('actions.newRequest')}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-[#141720] rounded-xl animate-pulse" />)}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{t('empty.requests')}</p>
        </div>
      ) : (
        <div className="bg-[#141720] border border-[#1e2130] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2130]">
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">{t('table.type')}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">{t('table.requestedBy')}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">{t('table.amount')}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">{t('table.note')}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">{t('table.status')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((row) => {
                const cfg = statusConfig[row.status]
                const Icon = cfg.icon
                return (
                  <tr key={row.id} className="border-b border-[#1e2130] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white font-medium">{row.template?.name ?? row.title ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{row.requester?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-white font-semibold">{formatCurrency(row.amount)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{row.notes ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {t(`status.${row.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'pending' && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleApprove(row.id)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                          >
                            {t('actions.approve')}
                          </button>
                          <button
                            onClick={() => setRejectTarget(row)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                          >
                            {t('actions.reject')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#0d1117] border border-[#1e2130] rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">{t('actions.newRequest')}</h2>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('table.amount')}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={addForm.amount}
                onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('template.name')}</label>
              <select
                value={addForm.template_id}
                onChange={e => setAddForm(p => ({ ...p, template_id: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">— بدون قالب —</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('table.note')}</label>
              <textarea
                value={addForm.note}
                onChange={e => setAddForm(p => ({ ...p, note: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2 border border-[#1e2130] text-slate-400 hover:text-white rounded-lg text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreate}
                disabled={!addForm.amount || createMutation.isPending}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {createMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#0d1117] border border-[#1e2130] rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">{t('reject.title')}</h2>
            <p className="text-sm text-slate-400">{rejectTarget.title} — {formatCurrency(rejectTarget.amount)}</p>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('reject.reason')}</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder={t('reject.reasonPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason('') }}
                className="flex-1 py-2 border border-[#1e2130] text-slate-400 hover:text-white rounded-lg text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
              >
                {t('reject.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}