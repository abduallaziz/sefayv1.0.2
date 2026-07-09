'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { Cart, PaymentData, PaymentMethod } from '../types/pos.types'
import type { Customer } from '@/features/customers/types/customer.types'

interface Props {
  cart: Cart
  customer?: Customer | null
  loyaltyEnabled?: boolean
  onConfirm: (data: PaymentData) => void
  onClose: () => void
  isSubmitting?: boolean
}

export function PaymentModal({ cart, customer, loyaltyEnabled = true, onConfirm, onClose, isSubmitting }: Props) {
  const t = useTranslations('pos')
  const currency = useTenantStore((s) => s.currency_symbol)
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cashTendered, setCashTendered] = useState(cart.total.toFixed(2))
  const [splitCash, setSplitCash] = useState('')
  const [redeemPoints, setRedeemPoints] = useState('')
  const [giftCardCode, setGiftCardCode] = useState('')
  const [giftCardApplied, setGiftCardApplied] = useState(false)
  const [giftCardAmount, setGiftCardAmount] = useState(cart.total.toFixed(2))

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const availablePoints = loyaltyEnabled ? (customer?.loyalty_points ?? 0) : 0
  const redeemPointsNum = loyaltyEnabled
    ? Math.min(parseInt(redeemPoints || '0', 10) || 0, availablePoints)
    : 0

  // The gift card pays down the total directly, before any payment method is even
  // relevant (mirrors InvoicesService.create on the backend: amountDueAfterGiftCard).
  // Cash tendered / split amounts below must validate against this remaining amount,
  // not the full cart total, or a fully-covered sale could never be confirmed.
  const giftCardAmountNum = giftCardApplied ? Math.min(parseFloat(giftCardAmount) || 0, cart.total) : 0
  const remainingDue = Math.max(0, cart.total - giftCardAmountNum)

  const change =
    method === 'cash' && parseFloat(cashTendered) >= remainingDue
      ? parseFloat(cashTendered) - remainingDue
      : 0

  const splitCard = method === 'split' && parseFloat(splitCash) < remainingDue
    ? remainingDue - parseFloat(splitCash)
    : 0

  const canConfirm = () => {
    if (isSubmitting) return false
    // Fully covered by the gift card — no payment method amount is required at all.
    if (remainingDue <= 0) return true
    if (method === 'cash') return parseFloat(cashTendered) >= remainingDue
    if (method === 'card') return true
    if (method === 'split') {
      const c = parseFloat(splitCash)
      return !isNaN(c) && c > 0 && c < remainingDue
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
      redeem_points: redeemPointsNum > 0 ? redeemPointsNum : undefined,
      gift_card_code: giftCardApplied ? giftCardCode.trim() : undefined,
      gift_card_amount: giftCardApplied ? giftCardAmountNum : undefined,
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
            <p className="text-3xl font-bold text-[#0C447C] dark:text-[#5B9BD5] mt-1">{fmt(remainingDue)} {currency}</p>
            {giftCardApplied && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {fmt(cart.total)} {currency} − {fmt(giftCardAmountNum)} {currency} ({t('payment.giftCard')})
              </p>
            )}
          </div>

          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 space-y-2">
            {giftCardApplied ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-violet-700 dark:text-violet-400 font-medium">
                  {t('payment.giftCardApplied')}: <span className="font-mono">{giftCardCode}</span> (−{fmt(giftCardAmountNum)} {currency})
                </span>
                <button
                  onClick={() => { setGiftCardApplied(false); setGiftCardCode('') }}
                  className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 shrink-0"
                >
                  {t('payment.giftCardRemove')}
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm text-violet-700 dark:text-violet-400 font-medium">{t('payment.giftCard')}</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('payment.giftCardCode')}
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                    className="flex-1 h-10 px-3 bg-white dark:bg-gray-900 border border-violet-500/30 text-gray-900 dark:text-white rounded-lg uppercase focus:outline-none focus:border-violet-500"
                  />
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={giftCardAmount}
                    onChange={(e) => setGiftCardAmount(e.target.value)}
                    className="w-24 h-10 px-2 text-center bg-white dark:bg-gray-900 border border-violet-500/30 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-violet-500"
                  />
                  <button
                    disabled={!giftCardCode.trim() || !(parseFloat(giftCardAmount) > 0)}
                    onClick={() => setGiftCardApplied(true)}
                    className="px-3 h-10 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium shrink-0"
                  >
                    {t('payment.giftCardApply')}
                  </button>
                </div>
              </>
            )}
          </div>

          {customer && availablePoints > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-700 dark:text-amber-400 font-medium">{t('payment.redeemPoints')}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('payment.availablePoints', { points: availablePoints })}
                </span>
              </div>
              <input
                type="number"
                min={0}
                max={availablePoints}
                placeholder="0"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                className="w-full h-10 text-center bg-white dark:bg-gray-900 border border-amber-500/30 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

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
                placeholder={fmt(remainingDue)}
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
