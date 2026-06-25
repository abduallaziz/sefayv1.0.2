'use client'

import { useTranslations } from 'next-intl'
import { Cart, PaymentData } from '../types/pos.types'

interface Props {
  cart: Cart
  payment: PaymentData
  invoiceNumber: string
  taxRate: number
  onClose: () => void
  onNewOrder: () => void
}

export function ReceiptModal({ cart, payment, invoiceNumber, taxRate, onClose, onNewOrder }: Props) {
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-sm shadow-xl">
        <div className="p-5">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl text-emerald-600 dark:text-emerald-400">✓</span>
            </div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('receipt.success')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('receipt.invoiceNumber', { number: invoiceNumber })}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{now}</p>
          </div>

          <div className="border-t border-dashed border-gray-200 dark:border-gray-700 py-3 space-y-1.5">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {item.name} {item.variant_name ? `(${item.variant_name})` : ''} × {item.quantity}
                </span>
                <span className="text-gray-900 dark:text-white">{fmt(item.total_price)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-200 dark:border-gray-700 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>{t('subtotal')}</span><span>{fmt(cart.subtotal)}</span>
            </div>
            {cart.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>{t('discount')}</span><span>−{fmt(cart.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>{t('receipt.taxLabel', { percent: taxPct })}</span><span>{fmt(cart.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-gray-900 dark:text-white">{t('total')}</span>
              <span className="text-[#0C447C] dark:text-[#5B9BD5]">{fmt(cart.total)} {t('receipt.currency')}</span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t('receipt.paymentMethod')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{paymentLabel}</span>
            </div>
            {payment.method === 'cash' && payment.change !== undefined && payment.change > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('receipt.change')}</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{fmt(payment.change)} {t('receipt.currency')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl text-sm font-medium"
          >
            {t('receipt.printButton')}
          </button>
          <button
            onClick={onNewOrder}
            className="flex-1 py-2.5 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-xl text-sm font-bold"
          >
            {t('receipt.newOrder')}
          </button>
        </div>
      </div>
    </div>
  )
}
