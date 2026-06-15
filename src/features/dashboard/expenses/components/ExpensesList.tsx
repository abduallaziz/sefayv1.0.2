'use client'

import { useState } from 'react'
import { Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { useExpenses, useApproveExpense, useRejectExpense } from '../hooks/useExpenses'
import { AddExpenseModal } from './AddExpenseModal'
import { formatCurrency } from '@/lib/format'
import type { Expense, ExpenseStatus } from '../api/expenses.api'

const statusConfig: Record<ExpenseStatus, { label: string; color: string; icon: any }> = {
  pending:  { label: 'معلق',   color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',    icon: Clock },
  approved: { label: 'موافق',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  rejected: { label: 'مرفوض', color: 'bg-red-500/10 text-red-400 border-red-500/20',           icon: XCircle },
  expired:  { label: 'منتهي', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',     icon: AlertCircle },
}

const typeLabel: Record<string, string> = {
  one_time: 'مرة واحدة',
  recurring: 'متكرر',
}

const recurrenceLabel: Record<string, string> = {
  daily: 'يومي',
  weekly: 'أسبوعي',
  monthly: 'شهري',
  yearly: 'سنوي',
}

export function ExpensesList() {
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          إضافة مصروف
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-[#141720] rounded-xl animate-pulse" />)}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>لا توجد مصروفات</p>
        </div>
      ) : (
        <div className="bg-[#141720] border border-[#1e2130] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2130]">
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">الفئة</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">المبلغ</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">النوع</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">بواسطة</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">الوصف</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">الحالة</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((row) => {
                const cfg = statusConfig[row.status]
                const Icon = cfg.icon
                return (
                  <tr key={row.id} className="border-b border-[#1e2130] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white font-medium">{row.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-white font-semibold">{formatCurrency(row.amount)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {typeLabel[row.type]}
                      {row.recurrence && <span className="ms-1 text-slate-600">({recurrenceLabel[row.recurrence]})</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{row.requester?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[120px] truncate">{row.notes?.split('|')[0]?.trim() || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'pending' && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => approveMutation.mutate(row.id)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                          >
                            موافقة
                          </button>
                          <button
                            onClick={() => setRejectTarget(row)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                          >
                            رفض
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

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} />}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#0d1117] border border-[#1e2130] rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">رفض المصروف</h2>
            <p className="text-sm text-slate-400">{rejectTarget.category?.name ?? '—'} — {formatCurrency(rejectTarget.amount)}</p>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">سبب الرفض</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="اكتب سبب الرفض..."
                rows={3}
                className="w-full px-3 py-2 text-sm bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setRejectTarget(null); setRejectReason('') }} className="flex-1 py-2 border border-[#1e2130] text-slate-400 hover:text-white rounded-lg text-sm">
                إلغاء
              </button>
              <button onClick={handleReject} disabled={rejectMutation.isPending} className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {rejectMutation.isPending ? '...' : 'تأكيد الرفض'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}