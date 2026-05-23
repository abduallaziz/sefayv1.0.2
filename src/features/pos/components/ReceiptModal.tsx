'use client'

import { Cart, PaymentData } from '../types/pos.types'
import { Button } from '@/shared/ui/button'

interface Props {
  cart: Cart
  payment: PaymentData
  invoiceNumber: string
  onClose: () => void
  onNewOrder: () => void
}

export function ReceiptModal({ cart, payment, invoiceNumber, onClose, onNewOrder }: Props) {
  const now = new Date().toLocaleString('ar-SA')

  const paymentLabel = {
    cash: 'نقداً',
    card: 'بطاقة',
    split: 'نقد + بطاقة',
  }[payment.method]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-xl">
        <div className="p-5">
          {/* Success Icon */}
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="font-bold text-xl">تم الدفع بنجاح</h3>
            <p className="text-sm text-muted-foreground mt-1">فاتورة #{invoiceNumber}</p>
            <p className="text-xs text-muted-foreground">{now}</p>
          </div>

          {/* Items */}
          <div className="border-t border-dashed border-border py-3 space-y-1.5">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.name} {item.variant_name ? `(${item.variant_name})` : ''} × {item.quantity}
                </span>
                <span>{item.total_price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-border py-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>المجموع الجزئي</span><span>{cart.subtotal.toFixed(2)}</span>
            </div>
            {cart.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>الخصم</span><span>−{cart.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>الضريبة 15%</span><span>{cart.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-border pt-2">
              <span>الإجمالي</span><span className="text-primary">{cart.total.toFixed(2)} ر.س</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">طريقة الدفع</span>
              <span className="font-medium">{paymentLabel}</span>
            </div>
            {payment.method === 'cash' && payment.change !== undefined && payment.change > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">الباقي</span>
                <span className="font-medium text-green-600">{payment.change.toFixed(2)} ر.س</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            طباعة 🖨️
          </Button>
          <Button className="flex-1 font-bold" onClick={onNewOrder}>
            طلب جديد
          </Button>
        </div>
      </div>
    </div>
  )
}