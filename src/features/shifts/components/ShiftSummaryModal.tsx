'use client'

import { useTranslations } from 'next-intl'
import { useShiftSummary } from '../hooks/useShifts'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { TrendingUp, TrendingDown, DollarSign, FileText, X } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

interface Props {
  shiftId: string
  onClose: () => void
}

export function ShiftSummaryModal({ shiftId, onClose }: Props) {
  const t = useTranslations('shifts')
  const currency = useTenantStore((s) => s.currency_symbol)
  const { data, isLoading } = useShiftSummary(shiftId)
  const summary = data?.summary

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('summary')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">{t('loading')}</div>
        ) : summary ? (
          <div className="space-y-1">
            <Row icon={FileText} label={t('total_invoices')} value={String(summary.totalInvoices)} />
            <Row icon={TrendingUp} label={t('total_sales')} value={formatCurrency(summary.totalRevenue, currency)} color="green" />
            <Row icon={DollarSign} label={t('cash_sales')} value={formatCurrency(summary.totalCash, currency)} />
            <Row icon={DollarSign} label={t('card_sales')} value={formatCurrency(summary.totalCard, currency)} />
            <Row icon={TrendingDown} label={t('total_expenses')} value={formatCurrency(summary.totalExpenses, currency)} color="red" />

            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3 space-y-1">
              <Row icon={DollarSign} label={t('opening_cash')} value={formatCurrency(summary.openingCash, currency)} />
              <Row icon={DollarSign} label={t('closing_cash')} value={formatCurrency(summary.closingCash ?? 0, currency)} />
              <Row icon={DollarSign} label={t('expected_cash')} value={formatCurrency(summary.expectedCash, currency)} />
              {summary.discrepancy !== null && (
                <Row
                  icon={DollarSign}
                  label={t('discrepancy')}
                  value={formatCurrency(Math.abs(summary.discrepancy), currency)}
                  color={summary.discrepancy === 0 ? 'green' : 'red'}
                  prefix={summary.discrepancy > 0 ? '+' : summary.discrepancy < 0 ? '-' : ''}
                />
              )}
            </div>
          </div>
        ) : null}

        <button
          onClick={onClose}
          className="mt-5 w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
        >
          {t('close')}
        </button>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, value, color, prefix = '' }: {
  icon: React.ElementType
  label: string
  value: string
  color?: 'green' | 'red'
  prefix?: string
}) {
  const valueColor =
    color === 'green' ? 'text-emerald-600 dark:text-emerald-400' :
    color === 'red' ? 'text-red-600 dark:text-red-400' :
    'text-gray-900 dark:text-white'

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <span className={`text-sm font-semibold ${valueColor}`}>{prefix}{value}</span>
    </div>
  )
}