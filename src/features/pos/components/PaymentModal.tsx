'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { Cart, PaymentData, PaymentMethod } from '../types/pos.types'
import type { Customer } from '@/features/customers/types/customer.types'
import { Button } from '@/shared/ui/button'

interface Props {
  cart: Cart
  customer?: Customer | null
  loyaltyEnabled?: boolean
  onConfirm: (data: PaymentData) => void
  onClose: () => void
  isSubmitting?: boolean
  error?: string | null
  availablePoints: number
  redeemPoints: string
  onRedeemPointsChange: (v: string) => void
  giftCardCode: string
  giftCardApplied: boolean
  giftCardAmount: string
  giftCardError: string | null
  validatingGiftCard: boolean
  onGiftCardCodeChange: (v: string) => void
  onGiftCardAmountChange: (v: string) => void
  onApplyGiftCard: () => void
  onRemoveGiftCard: () => void
}

export function PaymentModal({
  cart, onConfirm, onClose, isSubmitting, error,
  availablePoints, redeemPoints, onRedeemPointsChange,
  giftCardCode, giftCardApplied, giftCardAmount, giftCardError, validatingGiftCard,
  onGiftCardCodeChange, onGiftCardAmountChange, onApplyGiftCard, onRemoveGiftCard,
}: Props) {
  const t = useTranslations('pos')
  const currency = useTenantStore((s) => s.currency_symbol)
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cashTendered, setCashTendered] = useState(cart.total.toFixed(2))
  const [splitCash, setSplitCash] = useState('')

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const redeemPointsNum = Math.min(parseInt(redeemPoints || '0', 10) || 0, availablePoints)

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-posCloud-border dark:border-posCloudDark-border">
          <h3 className="font-bold text-lg text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('payment.title')}</h3>
          <button onClick={onClose} className="rounded p-1 opacity-70 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-posCloud-background dark:bg-posCloudDark-background rounded-xl p-4 text-center">
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('payment.due')}</p>
            <p className="text-3xl font-bold text-posCloud-primary mt-1">{fmt(remainingDue)} {currency}</p>
            {giftCardApplied && (
              <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mt-1">
                {fmt(cart.total)} {currency} − {fmt(giftCardAmountNum)} {currency} ({t('payment.giftCard')})
              </p>
            )}
          </div>

          <div className="bg-posCloud-info-light dark:bg-posCloud-info/15 border border-posCloud-info/20 rounded-xl p-3 space-y-2">
            {giftCardApplied ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-posCloud-info font-medium">
                  {t('payment.giftCardApplied')}: <span className="font-mono">{giftCardCode}</span> (−{fmt(giftCardAmountNum)} {currency})
                </span>
                <button
                  onClick={onRemoveGiftCard}
                  className="text-xs text-posCloud-danger hover:brightness-95 shrink-0"
                >
                  {t('payment.giftCardRemove')}
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm text-posCloud-info font-medium">{t('payment.giftCard')}</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('payment.giftCardCode')}
                    value={giftCardCode}
                    onChange={(e) => onGiftCardCodeChange(e.target.value.toUpperCase())}
                    className="flex-1 h-10 px-3 bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-info/30 text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg uppercase focus:outline-none focus:border-posCloud-info"
                  />
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={giftCardAmount}
                    onChange={(e) => onGiftCardAmountChange(e.target.value)}
                    className="w-24 h-10 px-2 text-center bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-info/30 text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-info"
                  />
                  <button
                    disabled={!giftCardCode.trim() || !(parseFloat(giftCardAmount) > 0) || validatingGiftCard}
                    onClick={onApplyGiftCard}
                    className="px-3 h-10 bg-posCloud-info hover:brightness-95 disabled:opacity-50 text-white rounded-lg text-sm font-medium shrink-0"
                  >
                    {validatingGiftCard ? t('checking') : t('payment.giftCardApply')}
                  </button>
                </div>
                {giftCardError && <p className="text-xs text-posCloud-danger">{giftCardError}</p>}
              </>
            )}
          </div>

          {error && (
            <div className="bg-posCloud-danger-light dark:bg-posCloud-danger/15 border border-posCloud-danger/20 rounded-lg p-3 text-sm text-posCloud-danger">
              {error}
            </div>
          )}

          {availablePoints > 0 && (
            <div className="bg-posCloud-warning-light dark:bg-posCloud-warning/15 border border-posCloud-warning/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-posCloud-warning font-medium">{t('payment.redeemPoints')}</span>
                <span className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                  {t('payment.availablePoints', { points: availablePoints })}
                </span>
              </div>
              <input
                type="number"
                min={0}
                max={availablePoints}
                placeholder="0"
                value={redeemPoints}
                onChange={(e) => onRedeemPointsChange(e.target.value)}
                className="w-full h-10 text-center bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-warning/30 text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-warning"
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
                    ? 'border-posCloud-primary bg-posCloud-primary-light dark:bg-posCloud-primary/15 text-posCloud-primary'
                    : 'border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:border-posCloud-primary/50'
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                {t(m.labelKey as any)}
              </button>
            ))}
          </div>

          {method === 'cash' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('payment.tendered')}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={fmt(remainingDue)}
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="w-full text-lg h-12 text-center font-bold bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary"
              />
              {change > 0 && (
                <div className="bg-posCloud-success-light dark:bg-posCloud-success/15 border border-posCloud-success/20 rounded-lg p-3 text-center">
                  <p className="text-sm text-posCloud-success">{t('payment.change')}</p>
                  <p className="text-xl font-bold text-posCloud-success">{fmt(change)} {currency}</p>
                </div>
              )}
            </div>
          )}

          {method === 'split' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('payment.splitCash')}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={splitCash}
                onChange={(e) => setSplitCash(e.target.value)}
                className="w-full text-center h-12 bg-posCloud-background dark:bg-posCloudDark-background border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-primary dark:text-posCloudDark-text-primary rounded-lg focus:outline-none focus:border-posCloud-primary"
              />
              {splitCard > 0 && (
                <div className="flex justify-between text-sm bg-posCloud-background dark:bg-posCloudDark-background rounded-lg p-3">
                  <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('payment.splitCard')}</span>
                  <span className="font-bold text-posCloud-primary">{fmt(splitCard)} {currency}</span>
                </div>
              )}
            </div>
          )}

          {method === 'card' && (
            <div className="bg-posCloud-primary-light dark:bg-posCloud-primary/15 border border-posCloud-primary/20 rounded-lg p-4 text-center text-sm text-posCloud-primary">
              {t('payment.cardInstruction')}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t('payment.cancel')}
          </Button>
          <Button
            disabled={!canConfirm()}
            onClick={handleConfirm}
            className="flex-[2] rounded-xl font-bold"
          >
            {isSubmitting ? t('common.processing') : t('payment.confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
