'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { Cart, PaymentData } from '../types/pos.types'
import { Button } from '@/shared/ui/button'

interface Props {
  cart: Cart
  payment: PaymentData
  invoiceNumber: string
  taxRate: number
  total: number
  onClose: () => void
  onNewOrder: () => void
}

export function ReceiptModal({ cart, payment, invoiceNumber, taxRate, total, onClose, onNewOrder }: Props) {
  const t = useTranslations('pos')
  const now = new Date().toLocaleString('en-US')
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const taxPct = `${(taxRate * 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`

  const paymentLabel = {
    cash: t('payment.cash'),
    card: t('payment.card'),
    split: t('receipt.methodSplit'),
  }[payment.method]

  const handlePrint = () => {
    window.print()
    onNewOrder()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Bounded to the viewport (max-h-[85vh]) so long orders never push the
          buttons off-screen. Only the item list scrolls internally — header,
          totals, and payment info stay put, and the action buttons are a
          sticky footer, never covered or pushed out of reach. */}
      <div className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-posCloud-border bg-posCloud-surface shadow-xl dark:border-posCloudDark-border dark:bg-posCloudDark-surface">
        <div className="shrink-0 px-5 pt-5">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-posCloud-success-light dark:bg-posCloud-success/15 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-posCloud-success" strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-xl text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('receipt.success')}</h3>
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mt-1">{t('receipt.invoiceNumber', { number: invoiceNumber })}</p>
            <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{now}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <div className="border-t border-dashed border-posCloud-border dark:border-posCloudDark-border py-3 space-y-1.5">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                  {item.name} {item.variant_name ? `(${item.variant_name})` : ''} × {item.quantity}
                </span>
                <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{fmt(item.total_price)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 px-5 pb-5">
          <div className="border-t border-dashed border-posCloud-border dark:border-posCloudDark-border py-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              <span>{t('subtotal')}</span><span>{fmt(cart.subtotal)}</span>
            </div>
            {cart.coupon_discount_amount > 0 && (
              <div className="flex justify-between text-posCloud-success">
                <span>{t('discount')}{cart.coupon_code ? ` (${cart.coupon_code})` : ''}</span>
                <span>−{fmt(cart.coupon_discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              <span>{t('receipt.taxLabel', { percent: taxPct })}</span><span>{fmt(cart.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-posCloud-border dark:border-posCloudDark-border pt-2">
              <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('total')}</span>
              <span className="text-posCloud-primary">{fmt(total)} {t('receipt.currency')}</span>
            </div>
          </div>

          <div className="bg-posCloud-background dark:bg-posCloudDark-background rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('receipt.paymentMethod')}</span>
              <span className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{paymentLabel}</span>
            </div>
            {payment.method === 'cash' && payment.change !== undefined && payment.change > 0 && (
              <div className="flex justify-between">
                <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('receipt.change')}</span>
                <span className="font-medium text-posCloud-success">{fmt(payment.change)} {t('receipt.currency')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-posCloud-border dark:border-posCloudDark-border p-5">
          <Button variant="outline" onClick={handlePrint} className="flex-1 rounded-xl">
            {t('receipt.printButton')}
          </Button>
          <Button onClick={onNewOrder} className="flex-1 rounded-xl font-bold">
            {t('receipt.newOrder')}
          </Button>
        </div>
      </div>
    </div>
  )
}
