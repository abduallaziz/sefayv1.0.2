'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { User, X } from 'lucide-react'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { couponsApi } from '@/features/coupons/api/coupons.api'
import { Cart } from '../types/pos.types'
import type { Customer } from '@/features/customers/types/customer.types'
import { Button } from '@/shared/ui/button'

interface Props {
  cart: Cart
  onUpdateQty: (cartId: string, qty: number) => void
  onRemoveItem: (cartId: string) => void
  onApplyCoupon: (coupon: string, discountAmount: number) => void
  onClearCoupon: () => void
  onCheckout: () => void
  onClear: () => void
  customerCaptureEnabled?: boolean
  selectedCustomer?: Customer | null
  onClearCustomer?: () => void
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function CartPanel({
  cart, onUpdateQty, onRemoveItem, onApplyCoupon, onClearCoupon, onCheckout, onClear,
  customerCaptureEnabled, selectedCustomer, onClearCustomer,
}: Props) {
  const t = useTranslations('pos')
  const currency = useTenantStore((s) => s.currency_symbol)
  const [showCoupon, setShowCoupon] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  // يتحقق فعليًا من الكود عبر /coupons/validate قبل قبوله — لا يُعرَض كمطبَّق أبدًا
  // إلا بعد تأكيد صحته ومبلغ خصمه الحقيقي من السيرفر.
  const handleApplyCoupon = async () => {
    const coupon = couponInput.trim()
    if (!coupon || cart.subtotal <= 0) return
    setValidatingCoupon(true)
    setCouponError(null)
    try {
      const result = await couponsApi.validate(coupon, cart.subtotal)
      onApplyCoupon(result.code, result.discount_amount)
      setShowCoupon(false)
      setCouponInput('')
    } catch (e: any) {
      setCouponError(e?.message ?? t('couponInvalid'))
    } finally {
      setValidatingCoupon(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[15px] text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('currentOrder')}</h2>
        {cart.items.length > 0 && (
          <button onClick={onClear} className="text-xs text-posCloud-danger hover:brightness-90">
            {t('clearAll')}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 mb-3">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
            <span className="text-4xl mb-2">🛒</span>
            <p className="text-sm">{t('noItems')}</p>
          </div>
        ) : (
          cart.items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 rounded-xl bg-posCloud-background dark:bg-posCloudDark-background p-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">{item.name}</p>
                {item.variant_name && (
                  <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{item.variant_name}</p>
                )}
                <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{fmt(item.unit_price)} {currency}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-md border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-secondary dark:text-posCloudDark-text-secondary text-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-md border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-secondary dark:text-posCloudDark-text-secondary text-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40"
                >
                  +
                </button>
              </div>
              <div className="text-end shrink-0">
                <p className="text-sm font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{fmt(item.total_price)} {currency}</p>
                <button onClick={() => onRemoveItem(item.id)} className="text-xs text-posCloud-danger hover:brightness-90">×</button>
              </div>
            </div>
          ))
        )}
      </div>

      {customerCaptureEnabled && selectedCustomer && (
        <div className="border-t border-posCloud-border dark:border-posCloudDark-border pt-3 mb-3">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-posCloud-background dark:bg-posCloudDark-background p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-posCloud-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">{selectedCustomer.full_name || '—'}</p>
                {selectedCustomer.phone && <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" dir="ltr">{selectedCustomer.phone}</p>}
              </div>
            </div>
            <button onClick={onClearCustomer} className="text-posCloud-text-tertiary hover:text-posCloud-danger shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* الكود يُتحقَّق منه فعليًا عبر /coupons/validate وقت التطبيق — نسبة/قيمة الخصم
          تُجلَب من تعريف الكوبون نفسه بالسيرفر، لا تُحدَّد يدويًا هنا أبدًا. أي تعديل على
          محتويات السلة بعد التطبيق يُلغي الكوبون تلقائيًا (راجع useCart) لتفادي عرض مبلغ
          خصم غير محدَّث. */}
      <div className="border-t border-posCloud-border dark:border-posCloudDark-border pt-3 mb-3">
        {cart.coupon_code ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-posCloud-primary font-medium">
              ✓ {t('couponCode')}: <span className="font-mono">{cart.coupon_code}</span> (−{fmt(cart.coupon_discount_amount)} {currency})
            </span>
            <button
              onClick={onClearCoupon}
              className="text-xs text-posCloud-danger hover:brightness-90"
            >
              {t('removeCoupon')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCoupon(!showCoupon)}
            className="text-sm text-posCloud-primary hover:brightness-90"
          >
            {t('addCoupon')}
          </button>
        )}

        {showCoupon && !cart.coupon_code && (
          <div className="mt-2 space-y-1.5">
            <div className="flex gap-2">
              <input
                placeholder={t('couponCode')}
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
                className="flex-1 min-w-0 rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background px-2.5 py-1.5 text-xs uppercase text-posCloud-text-primary dark:text-posCloudDark-text-primary outline-none placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={!couponInput.trim() || validatingCoupon}
                className="shrink-0 rounded-lg bg-posCloud-primary-light px-3 text-xs font-semibold text-posCloud-primary disabled:opacity-50"
              >
                {validatingCoupon ? t('checking') : t('apply')}
              </button>
            </div>
            {couponError && <p className="mt-1 text-[11px] text-posCloud-danger">{couponError}</p>}
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-xs border-t border-posCloud-border dark:border-posCloudDark-border pt-3 mb-3">
        <div className="flex justify-between text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
          <span>{t('subtotal')}</span>
          <span>{fmt(cart.subtotal)} {currency}</span>
        </div>
        {cart.coupon_discount_amount > 0 && (
          <div className="flex justify-between text-posCloud-success">
            <span>{t('discount')}</span>
            <span>−{fmt(cart.coupon_discount_amount)} {currency}</span>
          </div>
        )}
        <div className="flex justify-between text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
          <span>{t('tax')}</span>
          <span>{fmt(cart.tax_amount)} {currency}</span>
        </div>
        <div className="flex justify-between border-t border-posCloud-border dark:border-posCloudDark-border pt-2 text-base font-extrabold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
          <span>{t('total')}</span>
          <span>{fmt(cart.total)} {currency}</span>
        </div>
      </div>

      <Button
        size="lg"
        disabled={cart.items.length === 0}
        onClick={onCheckout}
        className="w-full"
      >
        {t('checkout')} — {fmt(cart.total)} {currency}
      </Button>
    </div>
  )
}
