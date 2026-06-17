'use client'

import { useState } from 'react'
import { Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { useExpenses, useApproveExpense, useRejectExpense } from '../hooks/useExpenses'
import { AddExpenseModal } from './AddExpenseModal'
import { formatCurrency } from '@/lib/format'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { useTranslations } from 'next-intl'
import type { Expense, ExpenseStatus } from '../api/expenses.api'

const statusConfig: Record<ExpenseStatus, { labelKey: string; color: string; icon: any }> = {
  pending:  { labelKey: 'status.pending',  color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',        icon: Clock },
  approved: { labelKey: 'status.approved', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  rejected: { labelKey: 'status.rejected', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',                icon: XCircle },
  expired:  { labelKey: 'status.expired',  color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',                            icon: AlertCircle },
}

export function ExpensesList() {
  const t = useTranslations('expenses')
  const currency = useTenantStore((s) => s.currency_symbol)
  const { data: expenses = [], isLoading } = useExpenses()
  const approveMutation = useApproveExpense()
  const rejectMutation = useRejectExpense()
  const [showAdd, setShowAdd] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<Expense | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  function handleReject() {
    if (!rejectTarget) return
    rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason }, {
      onSuccess: () => { setRejectTarget(null); setRejectReason('') }
    })
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('actions.newRequest')}</span>
          <span className="sm:hidden">{t('actions.new')}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{t('empty.requests')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[360px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-800">
                  <th className="text-start px-3 py-3 text-xs font-medium text-slate-500">{t('table.type')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-slate-500 w-24">{t('table.amount')}</th>
                  <th className="hidden sm:table-cell text-start px-3 py-3 text-xs font-medium text-slate-500">{t('table.requestedBy')}</th>
                  <th className="hidden md:table-cell text-start px-3 py-3 text-xs font-medium text-slate-500">{t('table.note')}</th>
                  <th className="text-start px-3 py-3 text-xs font-medium text-slate-500 w-24">{t('table.actions')}</th>
                  <th className="px-3 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {expenses.map((row) => {
                  const cfg = statusConfig[row.status]
                  const Icon = cfg.icon
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-3 py-3 text-slate-800 dark:text-white font-medium max-w-[100px] truncate">
                        {((row as any).category?.name) ?? (row.title || '—')}
                      </td>
                      <td className="px-3 py-3 text-slate-800 dark:text-white font-semibold w-24 tabular-nums">
                        {formatCurrency(row.amount, currency)}
                      </td>
                      <td className="hidden sm:table-cell px-3 py-3 text-slate-500 max-w-[100px] truncate">
                        {row.requester?.name ?? '—'}
                      </td>
                      <td className="hidden md:table-cell px-3 py-3 text-slate-400 text-xs max-w-[120px] truncate">
                        {row.notes?.split('|')[0]?.trim() || '—'}
                      </td>
                      <td className="px-3 py-3 w-24">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          <span className="hidden sm:inline">{t(cfg.labelKey as any)}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 w-24">
                        {row.status === 'pending' && (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => approveMutation.mutate(row.id)}
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setRejectTarget(row)}
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20"
                            >
                              ✕
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
        </div>
      )}

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} />}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">{t('reject.title')}</h2>
            <p className="text-sm text-slate-500">{rejectTarget.category?.name ?? '—'} — {formatCurrency(rejectTarget.amount, currency)}</p>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t('reject.reason')}</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder={t('reject.reasonPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] dark:focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason('') }}
                className="flex-1 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-sm transition-colors"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {rejectMutation.isPending ? '...' : t('reject.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}