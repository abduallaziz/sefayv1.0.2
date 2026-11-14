'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/shared/ui/page-header'
import { SectionCard } from '@/shared/ui/section-card'
import { StatusBadge } from '@/shared/ui/status-badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { usePermission } from '@/core/permissions/hooks/usePermission'
import { usePaymentMethodLabel, normalizePaymentMethod } from '../lib/payment-method'
import { useExpenseDepartments } from '../hooks/useExpenseDepartments'
import { useExpenseCategoriesV2 } from '../hooks/useExpenseCategories'
import {
  useQuickDefinitions,
  useCreateQuickDefinition,
  useUpdateQuickDefinition,
  useDeactivateQuickDefinition,
} from '../hooks/useQuickDefinitions'
import { QuickAmountMode, TaxMode, QuickDefinitionRecord } from '../api/expenses-v2.api'
import { ExpensesSectionNav } from '../components/ExpensesSectionNav'

export function QuickDefinitionsAdminPage() {
  const t = useTranslations('expensesV2.quickDefinitionsAdmin')
  const tBreadcrumb = useTranslations('expensesV2.breadcrumb')
  const locale = useLocale()
  const methodLabel = usePaymentMethodLabel()
  const canView = usePermission('expenses.view')
  const canManage = usePermission('expenses.configure')

  const departments = useExpenseDepartments()
  const categories = useExpenseCategoriesV2()
  const definitions = useQuickDefinitions(true)
  const create = useCreateQuickDefinition()
  const update = useUpdateQuickDefinition()
  const deactivate = useDeactivateQuickDefinition()

  const [label, setLabel] = useState('')
  const [amountMode, setAmountMode] = useState<QuickAmountMode>('fixed')
  const [fixedAmount, setFixedAmount] = useState('')
  const [taxMode, setTaxMode] = useState<TaxMode>('exclusive')
  const [departmentId, setDepartmentId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  if (!canView) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState icon={AlertTriangle} title={t('noPermission')} theme="dashboard" size="lg" />
      </div>
    )
  }

  const departmentMap = new Map(departments.data?.map((d) => [d.id, d.name]))
  const categoryMap = new Map(categories.data?.map((c) => [c.id, c.name]))

  const fixedNum = parseFloat(fixedAmount)
  const amountInvalid = amountMode === 'fixed' && !!fixedAmount && !(fixedNum > 0)
  const canSubmit =
    !!label.trim() &&
    !!paymentMethod.trim() &&
    (amountMode === 'variable' || (!!fixedAmount && fixedNum > 0))
  const saving = create.isPending || update.isPending

  const resetForm = () => {
    setEditingId(null)
    setLabel('')
    setFixedAmount('')
    setAmountMode('fixed')
    setTaxMode('exclusive')
    setDepartmentId('')
    setCategoryId('')
    setPaymentMethod('')
  }

  const startEdit = (d: QuickDefinitionRecord) => {
    setEditingId(d.id)
    setLabel(d.label)
    setAmountMode(d.amount_mode)
    setFixedAmount(d.fixed_amount != null ? String(d.fixed_amount) : '')
    setTaxMode(d.tax_mode)
    setDepartmentId(d.default_department_id ?? '')
    setCategoryId(d.default_category_id ?? '')
    setPaymentMethod(normalizePaymentMethod(d.default_payment_method) ?? 'other')
  }

  const handleSave = () => {
    if (!canSubmit || saving) return
    const dto = {
      label: label.trim(),
      amount_mode: amountMode,
      fixed_amount: amountMode === 'fixed' ? fixedNum : undefined,
      tax_mode: taxMode,
      default_department_id: departmentId || undefined,
      default_category_id: categoryId || undefined,
      default_payment_method: paymentMethod.trim(),
    }
    if (editingId) {
      update.mutate({ id: editingId, dto }, { onSuccess: resetForm })
    } else {
      create.mutate(dto, { onSuccess: resetForm })
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <ExpensesSectionNav />
      <PageHeader
        title={t('title')}
        theme="dashboard"
        breadcrumb={[
          { label: tBreadcrumb('home'), href: `/${locale}/dashboard` },
          { label: tBreadcrumb('expenses'), href: `/${locale}/dashboard/expenses-v2/expenses` },
          { label: t('title') },
        ]}
      />
      <SectionCard title={t('title')} description={t('description')} theme="dashboard">
        {canManage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <input
              value={label}
              maxLength={80}
              aria-label={t('labelPlaceholder')}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('labelPlaceholder')}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg"
            />
            <select
              value={amountMode}
              onChange={(e) => setAmountMode(e.target.value as QuickAmountMode)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg"
            >
              <option value="fixed">{t('amountModeFixed')}</option>
              <option value="variable">{t('amountModeVariable')}</option>
            </select>
            {amountMode === 'fixed' && (
              <input
                type="number"
                min="0"
                step="0.01"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                placeholder={t('fixedAmount')}
                className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg"
              />
            )}
            <select
              value={taxMode}
              onChange={(e) => setTaxMode(e.target.value as TaxMode)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg"
            >
              <option value="none">{t('taxModeNone')}</option>
              <option value="inclusive">{t('taxModeInclusive')}</option>
              <option value="exclusive">{t('taxModeExclusive')}</option>
            </select>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg"
            >
              <option value="">{t('defaultDepartment')}</option>
              {departments.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg"
            >
              <option value="">{t('defaultCategory')}</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              aria-label={t('paymentMethodPlaceholder')}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg"
            >
              <option value="">{t('paymentMethodPlaceholder')}</option>
              {['cash', 'card', 'bank_transfer', 'cheque', 'other'].map((m) => (
                <option key={m} value={m}>
                  {methodLabel(m)}
                </option>
              ))}
            </select>
            {amountInvalid && (
              <p role="alert" className="text-xs text-red-500 sm:col-span-2 lg:col-span-3">
                {t('amountInvalid')}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canSubmit || saving}
                onClick={handleSave}
                className="px-4 py-2 text-sm rounded-lg bg-[#0C447C] text-white disabled:opacity-50"
              >
                {editingId ? t('saveEdit') : t('add')}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-gray-700"
                >
                  {t('cancelEdit')}
                </button>
              )}
            </div>
          </div>
        )}

        {!definitions.data || definitions.data.length === 0 ? (
          <EmptyState title={t('empty')} theme="dashboard" size="sm" />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-gray-800">
            {definitions.data.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 flex-wrap gap-2">
                <div>
                  <span className="text-sm">{d.label}</span>
                  <span className="ms-2 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                    {d.amount_mode === 'fixed' ? `${t('amountModeFixed')}: ${d.fixed_amount}` : t('amountModeVariable')}
                    {[departmentMap.get(d.default_department_id ?? ''), categoryMap.get(d.default_category_id ?? '')]
                      .filter(Boolean)
                      .map((x) => ` · ${x}`)
                      .join('')}
                    {` · ${methodLabel(d.default_payment_method)}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge label={d.is_active ? t('active') : t('inactive')} tone={d.is_active ? 'success' : 'neutral'} />
                  {canManage && (
                    <button type="button" onClick={() => startEdit(d)} className="text-xs text-[#0C447C] hover:underline">
                      {t('edit')}
                    </button>
                  )}
                  {canManage && d.is_active && (
                    <button
                      type="button"
                      onClick={() => deactivate.mutate(d.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      {t('deactivate')}
                    </button>
                  )}
                  {canManage && !d.is_active && (
                    <button
                      type="button"
                      onClick={() => update.mutate({ id: d.id, dto: { is_active: true } })}
                      className="text-xs text-[#0C447C] hover:underline"
                    >
                      {t('reactivate')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
