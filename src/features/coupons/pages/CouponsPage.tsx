'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Ticket, Edit, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { formatNumber } from '@/lib/format'
import { EmptyState } from '@/shared/ui/empty-state'
import { useCoupons, useUpdateCoupon, useDeleteCoupon } from '../hooks/useCoupons'
import { CouponFormModal } from '../components/CouponFormModal'
import type { Coupon } from '../api/coupons.api'

function DiscountLabel({ coupon, currency }: { coupon: Coupon; currency: string }) {
  return coupon.discount_type === 'percentage'
    ? <span>{formatNumber(coupon.discount_value)}%</span>
    : <span>{formatNumber(coupon.discount_value)} {currency}</span>
}

type CouponState = 'active' | 'inactive' | 'exhausted' | 'expired' | 'upcoming'
type StateFilter = 'all' | CouponState

// Derived display state: the stored is_active flag alone said "active" for
// coupons that were used up, expired or not yet valid.
function couponState(c: Coupon): CouponState {
  if (!c.is_active) return 'inactive'
  if (c.max_uses && c.used_count >= c.max_uses) return 'exhausted'
  const today = new Date().toLocaleDateString('en-CA')
  if (c.valid_to && c.valid_to.slice(0, 10) < today) return 'expired'
  if (c.valid_from && c.valid_from.slice(0, 10) > today) return 'upcoming'
  return 'active'
}

const stateColor = (st: CouponState) =>
  st === 'active'
    ? 'text-emerald-600 dark:text-emerald-400'
    : st === 'inactive'
      ? 'text-gray-400'
      : 'text-amber-600 dark:text-amber-400'

export function CouponsPage() {
  const t = useTranslations('coupons')
  const currency = useCurrencyDisplay()
  const { data: allCoupons = [], isLoading } = useCoupons()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<StateFilter>('all')
  const coupons = allCoupons.filter(
    (c) =>
      (!search.trim() || c.code.toLowerCase().includes(search.trim().toLowerCase())) &&
      (stateFilter === 'all' || couponState(c) === stateFilter),
  )
  const { mutate: updateCoupon } = useUpdateCoupon()
  const { mutate: deleteCoupon } = useDeleteCoupon()

  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Coupon | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)

  const openCreate = () => { setSelected(null); setFormOpen(true) }
  const openEdit = (c: Coupon) => { setSelected(c); setFormOpen(true) }
  const toggleActive = (c: Coupon) => updateCoupon({ id: c.id, data: { is_active: !c.is_active } })
  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteCoupon(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('newCoupon')}
        </button>
      </div>

      {allCoupons.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 shrink-0 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className="w-full bg-transparent text-sm text-gray-900 dark:text-white outline-none"
            />
          </div>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value as StateFilter)}
            aria-label={t('status')}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="all">{t('allStatuses')}</option>
            {(['active', 'inactive', 'exhausted', 'expired', 'upcoming'] as CouponState[]).map((st) => (
              <option key={st} value={st}>{t(`state_${st}`)}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      ) : allCoupons.length > 0 && coupons.length === 0 ? (
        <p className="text-center py-12 text-sm text-gray-500">{t('noMatches')}</p>
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={t('noCoupons')}
          description={t('noCouponsHint')}
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('newCoupon')}
            </button>
          }
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {coupons.map((c) => (
              <div key={c.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-gray-900 dark:text-white truncate">{c.code}</p>
                    <p className="text-xs text-gray-500"><DiscountLabel coupon={c} currency={currency} /></p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.valid_from || c.valid_to
                        ? `${c.valid_from?.slice(0, 10) ?? '—'} → ${c.valid_to?.slice(0, 10) ?? '—'}`
                        : t('noExpiry')}
                      {c.min_order_amount ? ` · ${t('minOrderAmount')}: ${formatNumber(c.min_order_amount)} ${currency}` : ''}
                      {c.max_discount_amount ? ` · ${t('maxDiscountAmount')}: ${formatNumber(c.max_discount_amount)} ${currency}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" aria-label={t('editCoupon')} title={t('editCoupon')} onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><Edit className="w-3.5 h-3.5" /></button>
                    <button type="button" aria-label={t('deleteCoupon')} title={t('deleteCoupon')} onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500">
                    {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''} {t('uses')}
                  </span>
                  <button
                    onClick={() => toggleActive(c)}
                    className={`flex items-center gap-1 text-xs font-medium ${stateColor(couponState(c))}`}
                  >
                    {c.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}{t(`state_${couponState(c)}`)}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('code')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('discount')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('minOrderAmount')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('uses')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('validity')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500 w-28">{t('status')}</th>
                  <th className="px-3 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {coupons.map((c, i) => (
                  <tr key={c.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/40 dark:bg-gray-800/10' : ''}`}>
                    <td className="px-3 py-3 font-mono font-medium text-gray-900 dark:text-white">{c.code}</td>
                    <td className="px-3 py-3 text-gray-700 dark:text-gray-300">
                      <DiscountLabel coupon={c} currency={currency} />
                      {c.max_discount_amount ? <span className="block text-xs text-gray-400">{t('maxDiscountAmount')}: {formatNumber(c.max_discount_amount)} {currency}</span> : null}
                    </td>
                    <td className="px-3 py-3 text-gray-500">{c.min_order_amount ? `${formatNumber(c.min_order_amount)} ${currency}` : '—'}</td>
                    <td className="px-3 py-3 text-gray-500">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">
                      {c.valid_from || c.valid_to
                        ? `${c.valid_from?.slice(0, 10) ?? '—'} → ${c.valid_to?.slice(0, 10) ?? '—'}`
                        : t('noExpiry')}
                    </td>
                    <td className="px-3 py-3 w-28">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`flex items-center gap-1 text-xs font-medium ${stateColor(couponState(c))}`}
                      >
                        {c.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}<span>{t(`state_${couponState(c)}`)}</span>
                      </button>
                    </td>
                    <td className="px-3 py-3 w-16">
                      <div className="flex items-center gap-1">
                        <button type="button" aria-label={t('editCoupon')} title={t('editCoupon')} onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-white"><Edit className="w-3.5 h-3.5" /></button>
                        <button type="button" aria-label={t('deleteCoupon')} title={t('deleteCoupon')} onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {formOpen && (
        <CouponFormModal coupon={selected} onClose={() => { setFormOpen(false); setSelected(null) }} />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title={t('deleteCoupon')}
        message={t('deleteConfirm', { code: deleteTarget?.code ?? '' })}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </div>
  )
}
