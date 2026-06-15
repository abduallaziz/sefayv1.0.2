'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Cart, PaymentData, PaymentMethod } from '../types/pos.types'

interface Props {
  cart: Cart
  onConfirm: (data: PaymentData) => void
  onClose: () => void
  isSubmitting?: boolean
}

export function PaymentModal({ cart, onConfirm, onClose, isSubmitting }: Props) {
  const t = useTranslations('pos')
  const currency = t('currency')
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
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-[#1e2130]">
          <h3 className="font-bold text-lg text-white">{t('payment.title')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-[#141720] rounded-xl p-4 text-center">
            <p className="text-sm text-slate-500">{t('payment.due')}</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">{fmt(cart.total)} {currency}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                  method === m.id
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-[#1e2130] bg-[#141720] text-slate-400 hover:border-blue-500/50'
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                {t(m.labelKey as any)}
              </button>
            ))}
          </div>

          {method === 'cash' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">{t('payment.tendered')}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={fmt(cart.total)}
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="w-full text-lg h-12 text-center font-bold bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
              {change > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                  <p className="text-sm text-emerald-400">{t('payment.change')}</p>
                  <p className="text-xl font-bold text-emerald-400">{fmt(change)} {currency}</p>
                </div>
              )}
            </div>
          )}

          {method === 'split' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">{t('payment.splitCash')}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={splitCash}
                onChange={(e) => setSplitCash(e.target.value)}
                className="w-full text-center h-12 bg-[#141720] border border-[#1e2130] text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
              {splitCard > 0 && (
                <div className="flex justify-between text-sm bg-[#141720] rounded-lg p-3">
                  <span className="text-slate-400">{t('payment.splitCard')}</span>
                  <span className="font-bold text-blue-400">{fmt(splitCard)} {currency}</span>
                </div>
              )}
            </div>
          )}

          {method === 'card' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center text-sm text-blue-400">
              {t('payment.cardInstruction')}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#1e2130] text-slate-400 hover:text-white rounded-xl text-sm font-medium"
          >
            {t('payment.cancel')}
          </button>
          <button
            disabled={!canConfirm()}
            onClick={handleConfirm}
            className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
          >
            {isSubmitting ? t('common.processing') : t('payment.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}