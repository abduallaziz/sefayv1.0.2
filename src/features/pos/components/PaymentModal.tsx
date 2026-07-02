'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { Cart, PaymentData, PaymentMethod } from '../types/pos.types'

interface Props {
  cart: Cart
  onConfirm: (data: PaymentData) => void
  onClose: () => void
  isSubmitting?: boolean
}

export function PaymentModal({ cart, onConfirm, onClose, isSubmitting }: Props) {
  const t = useTranslations('pos')
  const currency = useTenantStore((s) => s.currency_symbol)
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cashTendered, setCashTendered] = useState(cart.total.toFixed(2))
  const [splitCash, setSplitCash] = useState('')

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const change =
    method === 'cash' && parseFloat(cashTendered) >= cart.total
      ? parseFloat(cashTendered) - cart.total
      : 0

  const splitCard = method === 'split' && parseFloat(splitCash) < cart.total
    ? cart.total - parseFloat(splitCash)
    : 0

  const canConfirm = () => {
    if (isSubmitting) return false
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

  const methods: { id: PaymentMethod; labelKey: string; icon: string }[] = [
    { id: 'cash', labelKey: 'payment.cash', icon: '💵' },
    { id: 'card', labelKey: 'payment.card', icon: '💳' },
    { id: 'split', labelKey: 'payment.split', icon: '⚡' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('payment.title')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('payment.due')}</p>
            <p className="text-3xl font-bold text-[#0C447C] dark:text-[#5B9BD5] mt-1">{fmt(cart.total)} {currency}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                  method === m.id
                    ? 'border-[#0C447C] bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5]'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:border-[#0C447C]/50'
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                {t(m.labelKey as any)}
              </button>
            ))}
          </div>

          {method === 'cash' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('payment.tendered')}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={fmt(cart.total)}
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="w-full text-lg h-12 text-center font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]"
              />
              {change > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('payment.change')}</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(change)} {currency}</p>
                </div>
              )}
            </div>
          )}

          {method === 'split' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('payment.splitCash')}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={splitCash}
                onChange={(e) => setSplitCash(e.target.value)}
                className="w-full text-center h-12 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]"
              />
              {splitCard > 0 && (
                <div className="flex justify-between text-sm bg-gray-50 dark:bg-white/5 rounded-lg p-3">
                  <span className="text-gray-500 dark:text-gray-400">{t('payment.splitCard')}</span>
                  <span className="font-bold text-[#0C447C] dark:text-[#5B9BD5]">{fmt(splitCard)} {currency}</span>
                </div>
              )}
            </div>
          )}

          {method === 'card' && (
            <div className="bg-[#0C447C]/10 border border-[#0C447C]/20 rounded-lg p-4 text-center text-sm text-[#0C447C] dark:text-[#5B9BD5]">
              {t('payment.cardInstruction')}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg text-sm font-medium"
          >
            {t('payment.cancel')}
          </button>
          <button
            disabled={!canConfirm()}
            onClick={handleConfirm}
            className="flex-[2] py-2.5 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-xl text-sm font-bold"
          >
            {isSubmitting ? t('common.processing') : t('payment.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
