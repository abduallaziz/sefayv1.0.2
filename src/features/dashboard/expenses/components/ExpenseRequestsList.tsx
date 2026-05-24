'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { DataTable, Column } from '@/shared/ui/data-table'
import { EmptyState } from '@/shared/ui/empty-state'
import { Modal } from '@/shared/ui/modal'
import { mockExpenses, mockTemplates, Expense, ExpenseStatus } from '../api/expenses.api'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

const statusConfig: Record<ExpenseStatus, { label: string; color: string; icon: any }> = {
  pending:  { label: 'pending',  color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',  icon: Clock },
  approved: { label: 'approved', color: 'bg-green-500/10 text-green-500 border-green-500/20',  icon: CheckCircle },
  rejected: { label: 'rejected', color: 'bg-red-500/10 text-red-500 border-red-500/20',        icon: XCircle },
  expired:  { label: 'expired',  color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',  icon: AlertCircle },
}

function hoursUntilExpiry(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 3600000))
}

export function ExpenseRequestsList() {
  const t = useTranslations('expenses')
  const tc = useTranslations('common')
  const [expenses, setExpenses] = useState(mockExpenses)
  const [rejectTarget, setRejectTarget] = useState<Expense | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  function handleApprove(id: string) {
    setExpenses(prev => prev.map(e =>
      e.id === id ? { ...e, status: 'approved' as ExpenseStatus, resolved_at: new Date().toISOString() } : e
    ))
  }

  function handleReject() {
    if (!rejectTarget) return
    setExpenses(prev => prev.map(e =>
      e.id === rejectTarget.id ? { ...e, status: 'rejected' as ExpenseStatus, resolved_at: new Date().toISOString() } : e
    ))
    setRejectTarget(null)
    setRejectReason('')
  }

  const columns: Column<Expense>[] = [
    {
      key: 'template_name',
      header: t('table.type'),
      render: (row) => (
        <span className="font-medium text-slate-800">{row.template_name}</span>
      ),
    },
    {
      key: 'requested_by',
      header: t('table.requestedBy'),
      render: (row) => (
        <span className="text-slate-600">{row.requested_by}</span>
      ),
    },
    {
      key: 'amount',
      header: t('table.amount'),
      render: (row) => (
        <span className="font-semibold text-slate-800">{row.amount} ر.س</span>
      ),
    },
    {
      key: 'note',
      header: t('table.note'),
      render: (row) => (
        <span className="text-slate-500 text-xs">{row.note || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: t('table.expires'),
      render: (row) => {
        if (row.status !== 'pending') return null
        const hours = hoursUntilExpiry(row.expires_at)
        return (
          <span className="text-xs text-amber-600">
            {t('expiresIn')} {hours} {t('hours')}
          </span>
        )
      },
    },
    {
      key: 'status_badge',
      header: '',
      render: (row) => {
        const cfg = statusConfig[row.status]
        const Icon = cfg.icon
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {t(`status.${row.status}`)}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: t('table.actions'),
      align: 'right',
      render: (row) => {
        if (row.status !== 'pending') return null
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleApprove(row.id) }}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20 transition-colors"
            >
              {t('actions.approve')}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setRejectTarget(row) }}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors"
            >
              {t('actions.reject')}
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={expenses}
        keyExtractor={(row) => row.id}
        theme="dashboard"
        emptyState={
        <EmptyState
            title={t('empty.requests')}
            icon={Clock}
        />
        }
      />

      {/* Reject Modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason('') }}
        title={t('reject.title')}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {rejectTarget?.template_name} — {rejectTarget?.amount} ر.س
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              {t('reject.reason')}
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={t('reject.reasonPlaceholder')}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setRejectTarget(null); setRejectReason('') }}
              className="px-4 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {tc('cancel')}
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              {t('reject.submit')}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}