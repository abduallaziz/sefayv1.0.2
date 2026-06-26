'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { User, X } from 'lucide-react'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { NumberInput } from '@/shared/ui/number-input'
import { Cart } from '../types/pos.types'
import type { Customer } from '@/features/customers/types/customer.types'

interface Props {
  cart: Cart
  onUpdateQty: (cartId: string, qty: number) => void
  onRemoveItem: (cartId: string) => void
  onApplyDiscount: (type: Cart['discount_type'], value: number, coupon?: string) => void
  onCheckout: () => void
  onClear: () => void
  customerCaptureEnabled?: boolean
  selectedCustomer?: Customer | null
  onClearCustomer?: () => void
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function CartPanel({
  cart, onUpdateQty, onRemoveItem, onApplyDiscount, onCheckout, onClear,
  customerCaptureEnabled, selectedCustomer, onClearCustomer,
}: Props) {
  const t = useTranslations('pos')
  const currency = useTenantStore((s) => s.currency_symbol)
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountInput, setDiscountInput] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [couponInput, setCouponInput] = useState('')

  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput)
    if (!isNaN(val) && val > 0) {
      onApplyDiscount(discountType, val)
      setShowDiscount(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-base text-gray-900 dark:text-white">{t('currentOrder')}</h2>
        {cart.items.length > 0 && (
          <button onClick={onClear} className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300">
            {t('clearAll')}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 mb-3">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500">
            <span className="text-4xl mb-2">🛒</span>
            <p className="text-sm">{t('noItems')}</p>
          </div>
        ) : (
          cart.items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-white/5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                {item.variant_name && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">{item.variant_name}</p>
                )}
                <p className="text-xs text-[#0C447C] dark:text-[#5B9BD5] mt-0.5">{fmt(item.unit_price)} {currency}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white"
                >
                  +
                </button>
              </div>
              <div className="text-end">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{fmt(item.total_price)} {currency}</p>
                <button onClick={() => onRemoveItem(item.id)} className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300">×</button>
              </div>
            </div>
          ))
        )}
      </div>

      {customerCaptureEnabled && selectedCustomer && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mb-3">
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-[#0C447C] dark:text-[#5B9BD5] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedCustomer.full_name || '—'}</p>
                {selectedCustomer.phone && <p className="text-xs text-gray-500 dark:text-gray-400" dir="ltr">{selectedCustomer.phone}</p>}
              </div>
            </div>
            <button onClick={onClearCustomer} className="text-gray-400 hover:text-red-500 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mb-3">
        <button
          onClick={() => setShowDiscount(!showDiscount)}
          className="text-sm text-[#0C447C] dark:text-[#5B9BD5] hover:text-[#0a3a6b] dark:hover:text-blue-300"
        >
          {cart.discount_amount > 0
            ? `✓ ${t('discountApplied')}: −${fmt(cart.discount_amount)} ${currency}`
            : t('addDiscount')}
        </button>

        {showDiscount && (
          <div className="mt-2 space-y-2 bg-gray-50 dark:bg-white/5 rounded-lg p-3">
            <div className="flex gap-2">
              <button
                onClick={() => setDiscountType('percentage')}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${
                  discountType === 'percentage'
                    ? 'bg-[#0C447C] text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {t('percentage')}
              </button>
              <button
                onClick={() => setDiscountType('fixed')}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${
                  discountType === 'fixed'
                    ? 'bg-[#0C447C] text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {t('fixed')}
              </button>
            </div>
            <NumberInput
              placeholder={discountType === 'percentage' ? '10' : '20'}
              value={discountInput}
              onChange={setDiscountInput}
              className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]"
            />
            <input
              placeholder={t('couponCode')}
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C] placeholder-gray-400 dark:placeholder-gray-600"
            />
            <button
              onClick={handleApplyDiscount}
              className="w-full py-1.5 bg-[#0C447C] hover:bg-[#0a3a6b] text-white text-sm rounded-lg transition-colors"
            >
              {t('apply')}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-sm border-t border-gray-100 dark:border-gray-700 pt-3 mb-3">
        <div className="flex justify-between text-gray-500 dark:text-gray-400">
          <span>{t('subtotal')}</span>
          <span>{fmt(cart.subtotal)} {currency}</span>
        </div>
        {cart.discount_amount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span>{t('discount')}</span>
            <span>−{fmt(cart.discount_amount)} {currency}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-500 dark:text-gray-400">
          <span>{t('tax')}</span>
          <span>{fmt(cart.tax_amount)} {currency}</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100 dark:border-gray-700">
          <span className="text-gray-900 dark:text-white">{t('total')}</span>
          <span className="text-[#0C447C] dark:text-[#5B9BD5]">{fmt(cart.total)} {currency}</span>
        </div>
      </div>

      <button
        className="w-full h-12 text-base font-bold bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-xl transition-colors"
        disabled={cart.items.length === 0}
        onClick={onCheckout}
      >
        {t('checkout')} — {fmt(cart.total)} {currency}
      </button>
    </div>
  )
}