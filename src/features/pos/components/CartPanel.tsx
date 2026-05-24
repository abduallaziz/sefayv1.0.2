// src/features/pos/components/CartPanel.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Cart } from '../types/pos.types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

interface Props {
  cart: Cart
  onUpdateQty: (cartId: string, qty: number) => void
  onRemoveItem: (cartId: string) => void
  onApplyDiscount: (type: Cart['discount_type'], value: number, coupon?: string) => void
  onCheckout: () => void
  onClear: () => void
}

export function CartPanel({ cart, onUpdateQty, onRemoveItem, onApplyDiscount, onCheckout, onClear }: Props) {
  const t = useTranslations('pos')
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
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-base">{t('currentOrder')}</h2>
        {cart.items.length > 0 && (
          <button onClick={onClear} className="text-xs text-destructive hover:underline">
            {t('clearAll')}
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <span className="text-4xl mb-2">🛒</span>
            <p className="text-sm">{t('noItems')}</p>
          </div>
        ) : (
          cart.items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                {item.variant_name && (
                  <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                )}
                <p className="text-xs text-primary mt-0.5">{item.unit_price} {t('payment.cash')}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-md bg-background border border-border text-sm flex items-center justify-center hover:bg-muted"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                  className="w-6 h-6 rounded-md bg-background border border-border text-sm flex items-center justify-center hover:bg-muted"
                >
                  +
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{item.total_price} ر.س</p>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-xs text-destructive hover:underline"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Discount Section */}
      <div className="border-t border-border pt-3 mb-3">
        <button
          onClick={() => setShowDiscount(!showDiscount)}
          className="text-sm text-primary hover:underline"
        >
          {cart.discount_amount > 0
            ? `✓ ${t('discountApplied')}: −${cart.discount_amount} ر.س`
            : t('addDiscount')}
        </button>

        {showDiscount && (
          <div className="mt-2 space-y-2 bg-muted/50 rounded-lg p-3">
            <div className="flex gap-2">
              <button
                onClick={() => setDiscountType('percentage')}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${discountType === 'percentage' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'}`}
              >
                {t('percentage')}
              </button>
              <button
                onClick={() => setDiscountType('fixed')}
                className={`flex-1 py-1 rounded-md text-xs font-medium transition-colors ${discountType === 'fixed' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border'}`}
              >
                {t('fixed')}
              </button>
            </div>
            <Input
              type="number"
              placeholder={discountType === 'percentage' ? '10' : '20'}
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="text-sm h-8"
            />
            <Input
              placeholder={t('couponCode')}
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="text-sm h-8"
            />
            <Button size="sm" className="w-full h-8" onClick={handleApplyDiscount}>
              {t('apply')}
            </Button>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="space-y-1.5 text-sm border-t border-border pt-3 mb-3">
        <div className="flex justify-between text-muted-foreground">
          <span>{t('subtotal')}</span>
          <span>{cart.subtotal.toFixed(2)} ر.س</span>
        </div>
        {cart.discount_amount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>{t('discount')}</span>
            <span>−{cart.discount_amount.toFixed(2)} ر.س</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>{t('tax')}</span>
          <span>{cart.tax_amount.toFixed(2)} ر.س</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
          <span>{t('total')}</span>
          <span className="text-primary">{cart.total.toFixed(2)} ر.س</span>
        </div>
      </div>

      {/* Checkout Button */}
      <Button
        className="w-full h-12 text-base font-bold"
        disabled={cart.items.length === 0}
        onClick={onCheckout}
      >
        {t('checkout')} — {cart.total.toFixed(2)} ر.س
      </Button>
    </div>
  )
}