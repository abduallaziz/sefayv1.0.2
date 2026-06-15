'use client'

import { Cart, PaymentData } from '../types/pos.types'

interface Props {
  cart: Cart
  payment: PaymentData
  invoiceNumber: string
  onClose: () => void
  onNewOrder: () => void
}

export function ReceiptModal({ cart, payment, invoiceNumber, onClose, onNewOrder }: Props) {
  const now = new Date().toLocaleString('en-US')
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const paymentLabel = {
    cash: 'نقداً',
    card: 'بطاقة',
    split: 'نقد + بطاقة',
  }[payment.method]

  const handlePrint = () => {
    window.print()
    onNewOrder()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-2xl w-full max-w-sm shadow-xl">
        <div className="p-5">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl text-emerald-400">✓</span>
            </div>
            <h3 className="font-bold text-xl text-white">تم الدفع بنجاح</h3>
            <p className="text-sm text-slate-500 mt-1">فاتورة #{invoiceNumber}</p>
            <p className="text-xs text-slate-600">{now}</p>
          </div>

          <div className="border-t border-dashed border-[#1e2130] py-3 space-y-1.5">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {item.name} {item.variant_name ? `(${item.variant_name})` : ''} × {item.quantity}
                </span>
                <span className="text-white">{fmt(item.total_price)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-[#1e2130] py-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>المجموع الجزئي</span><span>{fmt(cart.subtotal)}</span>
            </div>
            {cart.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>الخصم</span><span>−{fmt(cart.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>الضريبة 15%</span><span>{fmt(cart.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-[#1e2130] pt-2">
              <span className="text-white">الإجمالي</span>
              <span className="text-blue-400">{fmt(cart.total)} ر.س</span>
            </div>
          </div>

          <div className="bg-[#141720] rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">طريقة الدفع</span>
              <span className="font-medium text-white">{paymentLabel}</span>
            </div>
            {payment.method === 'cash' && payment.change !== undefined && payment.change > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">الباقي</span>
                <span className="font-medium text-emerald-400">{fmt(payment.change)} ر.س</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 border border-[#1e2130] text-slate-400 hover:text-white rounded-xl text-sm font-medium"
          >
            طباعة 🖨️
          </button>
          <button
            onClick={onNewOrder}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold"
          >
            طلب جديد
          </button>
        </div>
      </div>
    </div>
  )
}