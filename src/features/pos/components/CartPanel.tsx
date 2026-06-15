'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Cart } from '../types/pos.types'

interface Props {
  cart: Cart
  onUpdateQty: (cartId: string, qty: number) => void
  onRemoveItem: (cartId: string) => void
  onApplyDiscount: (type: Cart['discount_type'], value: number, coupon?: string) => void
  onCheckout: () => void
  onClear: () => void
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function CartPanel({ cart, onUpdateQty, onRemoveItem, onApplyDiscount, onCheckout, onClear }: Props) {
  const t = useTranslations('pos')
  const currency = t('currency')
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-base text-white">{t('currentOrder')}</h2>
        {cart.items.length > 0 && (
          <button onClick={onClear} className="text-xs text-red-400 hover:text-red-300">
            {t('clearAll')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <span className="text-4xl mb-2">🛒</span>
            <p className="text-sm">{t('noItems')}</p>
          </div>
        ) : (
          cart.items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                {item.variant_name && (
                  <p className="text-xs text-slate-500">{item.variant_name}</p>
                )}
                <p className="text-xs text-blue-400 mt-0.5">{fmt(item.unit_price)} {currency}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-md bg-[#0d1117] border border-[#1e2130] text-sm flex items-center justify-center hover:bg-white/5 text-white"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-medium text-white">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-md bg-[#0d1117] border border-[#1e2130] text-sm flex items-center justify-center hover:bg-white/5 text-white"
                >
                  +
                </button>
              </div>
              <div className="text-end">
                <p className="text-sm font-bold text-white">{fmt(item.total_price)} {currency}</p>
                <button onClick={() => onRemoveItem(item.id)} className="text-xs text-red-400 hover:text-red-300">×</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-[#1e2130] pt-3 mb-3">
        <button
          onClick={() => setShowDiscount(!showDiscount)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          {cart.discount_amount > 0
            ? `✓ ${t('discountApplied')}: −${fmt(cart.discount_amount)} ${currency}`
            : t('addDiscount')}
        </button>

        {showDiscount && (
          <div className="mt-2 space-y-2 bg-white/5 rounded-lg p-3">
            <div className="flex gap-2">
              <button
                onClick={() => setDiscountType('percentage')}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-[#0d1117] border border-[#1e2130] text-slate-400'}`}
              >
                {t('percentage')}
              </button>
              <button
                onClick={() => setDiscountType('fixed')}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${discountType === 'fixed' ? 'bg-blue-600 text-white' : 'bg-[#0d1117] border border-[#1e2130] text-slate-400'}`}
              >
                {t('fixed')}
              </button>
            </div>
            <input
              type="number"
              placeholder={discountType === 'percentage' ? '10' : '20'}
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-[#0d1117] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
            <input
              placeholder={t('couponCode')}
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-[#0d1117] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-600"
            />
            <button
              onClick={handleApplyDiscount}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
            >
              {t('apply')}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-sm border-t border-[#1e2130] pt-3 mb-3">
        <div className="flex justify-between text-slate-400">
          <span>{t('subtotal')}</span>
          <span>{fmt(cart.subtotal)} {currency}</span>
        </div>
        {cart.discount_amount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>{t('discount')}</span>
            <span>−{fmt(cart.discount_amount)} {currency}</span>
          </div>
        )}
        <div className="flex justify-between text-slate-400">
          <span>{t('tax')}</span>
          <span>{fmt(cart.tax_amount)} {currency}</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-1 border-t border-[#1e2130]">
          <span className="text-white">{t('total')}</span>
          <span className="text-blue-400">{fmt(cart.total)} {currency}</span>
        </div>
      </div>

      <button
        className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors"
        disabled={cart.items.length === 0}
        onClick={onCheckout}
      >
        {t('checkout')} — {fmt(cart.total)} {currency}
      </button>
    </div>
  )
}