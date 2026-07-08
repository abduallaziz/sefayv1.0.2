'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCreateCoupon, useUpdateCoupon } from '../hooks/useCoupons'
import type { Coupon, CouponDiscountType } from '../api/coupons.api'
import { SingleDatePicker } from '@/shared/ui/date-range-picker'

interface Props {
  coupon?: Coupon | null
  onClose: () => void
}

export function CouponFormModal({ coupon, onClose }: Props) {
  const t = useTranslations('coupons')
  const isEdit = !!coupon
  const { mutate: createCoupon, isPending: creating } = useCreateCoupon()
  const { mutate: updateCoupon, isPending: updating } = useUpdateCoupon()
  const isPending = creating || updating

  const [code, setCode] = useState(coupon?.code ?? '')
  const [discountType, setDiscountType] = useState<CouponDiscountType>(coupon?.discount_type ?? 'percentage')
  const [discountValue, setDiscountValue] = useState(coupon ? String(coupon.discount_value) : '')
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(coupon?.max_discount_amount ? String(coupon.max_discount_amount) : '')
  const [minOrderAmount, setMinOrderAmount] = useState(coupon?.min_order_amount ? String(coupon.min_order_amount) : '')
  const [maxUses, setMaxUses] = useState(coupon?.max_uses ? String(coupon.max_uses) : '')
  const [validFrom, setValidFrom] = useState<string | undefined>(coupon?.valid_from?.slice(0, 10))
  const [validTo, setValidTo] = useState<string | undefined>(coupon?.valid_to?.slice(0, 10))
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!code.trim() || !discountValue) return
    setError(null)

    const payload = {
      code: code.trim(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined,
      min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
      max_uses: maxUses ? parseInt(maxUses, 10) : undefined,
      valid_from: validFrom || undefined,
      valid_to: validTo || undefined,
    }

    const onDone = {
      onSuccess: () => onClose(),
      onError: (e: any) => setError(e?.message ?? t('error')),
    }

    if (isEdit) {
      updateCoupon({ id: coupon.id, data: payload }, onDone)
    } else {
      createCoupon(payload, onDone)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
          {isEdit ? t('editCoupon') : t('newCoupon')}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('code')}</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t('codePlaceholder')}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('discountType')}</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="percentage">{t('percentage')}</option>
                <option value="fixed">{t('fixed')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('discountValue')}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {discountType === 'percentage' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('maxDiscountAmount')}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder={t('optional')}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('minOrderAmount')}</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder={t('optional')}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('maxUses')}</label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder={t('unlimited')}
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('validFrom')}</label>
              <SingleDatePicker value={validFrom} onChange={setValidFrom} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('validTo')}</label>
              <SingleDatePicker value={validTo} onChange={setValidTo} />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !code.trim() || !discountValue}
            className="flex-[2] py-2.5 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-xl text-sm font-bold"
          >
            {isPending ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
