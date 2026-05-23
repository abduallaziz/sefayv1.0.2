'use client'

import { useState } from 'react'
import { Cart, PaymentData, PaymentMethod } from '../types/pos.types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

interface Props {
  cart: Cart
  onConfirm: (data: PaymentData) => void
  onClose: () => void
}

export function PaymentModal({ cart, onConfirm, onClose }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cashTendered, setCashTendered] = useState('')
  const [splitCash, setSplitCash] = useState('')

  const change =
    method === 'cash' && parseFloat(cashTendered) >= cart.total
      ? parseFloat(cashTendered) - cart.total
      : 0

  const splitCard = method === 'split' && parseFloat(splitCash) < cart.total
    ? cart.total - parseFloat(splitCash)
    : 0

  const canConfirm = () => {
    if (method === 'cash') return parseFloat(cashTendered) >= cart.total
    if (method === 'card') return true
    if (method === 'split') {
      const c = parseFloat(splitCash)
      return !isNaN(c) && c > 0 && c < cart.total
    }
    return false
  }

  const handleConfirm = () => {
    const data: PaymentData = {
      method,
      cash_tendered: method === 'cash' ? parseFloat(cashTendered) : undefined,
      change: method === 'cash' ? change : undefined,
      split_cash: method === 'split' ? parseFloat(splitCash) : undefined,
      split_card: method === 'split' ? splitCard : undefined,
    }
    onConfirm(data)
  }

  const methods: { id: PaymentMethod; label: string; icon: string }[] = [
    { id: 'cash', label: 'نقداً', icon: '💵' },
    { id: 'card', label: 'بطاقة', icon: '💳' },
    { id: 'split', label: 'مختلط', icon: '⚡' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-lg">إتمام الدفع</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Total */}
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">المبلغ المستحق</p>
            <p className="text-3xl font-bold text-primary mt-1">{cart.total.toFixed(2)} ر.س</p>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                  method === m.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Cash Input */}
          {method === 'cash' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">المبلغ المدفوع</label>
              <Input
                type="number"
                placeholder={`${cart.total.toFixed(2)}`}
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="text-lg h-12 text-center font-bold"
              />
              {change > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                  <p className="text-sm text-green-700 dark:text-green-400">الباقي للعميل</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-400">{change.toFixed(2)} ر.س</p>
                </div>
              )}
            </div>
          )}

          {/* Split Input */}
          {method === 'split' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">المبلغ نقداً</label>
              <Input
                type="number"
                placeholder="0.00"
                value={splitCash}
                onChange={(e) => setSplitCash(e.target.value)}
                className="text-center h-12"
              />
              {splitCard > 0 && (
                <div className="flex justify-between text-sm bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground">المتبقي على البطاقة</span>
                  <span className="font-bold text-primary">{splitCard.toFixed(2)} ر.س</span>
                </div>
              )}
            </div>
          )}

          {method === 'card' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center text-sm text-blue-700 dark:text-blue-400">
              وجّه العميل للطرفية وأكّد الدفع
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>إلغاء</Button>
          <Button className="flex-2 flex-grow-[2] font-bold" disabled={!canConfirm()} onClick={handleConfirm}>
            تأكيد الدفع
          </Button>
        </div>
      </div>
    </div>
  )
}