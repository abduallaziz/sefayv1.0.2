'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, ShoppingCart, Check, CreditCard, Calculator, Delete, Gift, Coins, Minus, Plus, User } from 'lucide-react'
import Image from 'next/image'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { Cart, CartItem, PaymentData, PaymentMethod } from '../types/pos.types'
import { calcCart } from '../hooks/useCart'
import type { Customer } from '@/features/customers/types/customer.types'
import type { CustomerRewardInstance } from '@/features/rewards/api/rewards.api'
import { Button } from '@/shared/ui/button'
import { MethodMark } from '@/shared/ui/method-mark'

// The line's own photo, or the same calm first-letter tile the product cards
// use. (The old stand-in photos fetched from a third-party site are gone.)
function LineImage({ cartItem }: { cartItem: CartItem }) {
  const [failed, setFailed] = useState(false)
  if (!cartItem.image_url || failed) {
    const initial = Array.from(cartItem.name.trim())[0]?.toUpperCase()
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-posCloud-primary-light text-sm font-bold text-posCloud-primary dark:bg-posCloud-primary/15">
        {initial}
      </div>
    )
  }
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-posCloud-background dark:bg-posCloudDark-background">
      <Image
        src={cartItem.image_url}
        alt={cartItem.name}
        fill
        sizes="40px"
        className="object-cover"
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  )
}

interface Props {
  cart: Cart
  customer?: Customer | null
  // T11 - methods the owner left switched on (GET /tenant/pos-config).
  // Undefined = show all; cash is always shown.
  enabledMethods?: string[]
  // Currency value of one redeemed point (pos-config), to preview the discount.
  redemptionValue: number
  onConfirm: (data: PaymentData) => void
  onClose: () => void
  isSubmitting?: boolean
  error?: string | null
  availablePoints: number
  redeemPoints: string
  onRedeemPointsChange: (v: string) => void
  availableRewards?: CustomerRewardInstance[]
  selectedRewardIds?: string[]
  onToggleReward?: (id: string) => void
}

// Every value here is real and accepted by CreateInvoiceDto.payment_method on
// the backend (api/src/modules/invoices/dto/create-invoice.dto.ts) and
// persisted by invoices.service.ts — none of this is fabricated. Only
// 'cash' and 'split' need an amount-tendered/change flow below; every other
// method is "paid in full via that method", same as 'card' already was.
// 'tab' (deferred/on-account) and generic 'card' are supported by the type
// but intentionally not offered as buttons here — 'tab' requires a selected
// customer and deserves its own dedicated flow, and pos-cloud's reference
// design lists specific card networks instead of a generic "card" button.
const METHODS: { id: PaymentMethod; labelKey: string }[] = [
  { id: 'cash', labelKey: 'payment.cash' },
  { id: 'mada', labelKey: 'payment.mada' },
  { id: 'visa', labelKey: 'payment.visa' },
  { id: 'mastercard', labelKey: 'payment.mastercard' },
  { id: 'apple_pay', labelKey: 'payment.applePay' },
  { id: 'stc_pay', labelKey: 'payment.stcPay' },
  { id: 'wallet', labelKey: 'payment.wallet' },
  { id: 'split', labelKey: 'payment.split' },
]

const round2 = (n: number) => parseFloat(n.toFixed(2))

const card = 'rounded-xl border border-posCloud-border bg-posCloud-surface dark:border-posCloudDark-border dark:bg-posCloudDark-surface'
const muted = 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary'
const strong = 'text-posCloud-text-primary dark:text-posCloudDark-text-primary'

export function PaymentModal({
  cart, customer, enabledMethods, redemptionValue, onConfirm, onClose, isSubmitting, error,
  availablePoints, redeemPoints, onRedeemPointsChange,
  availableRewards = [], selectedRewardIds = [], onToggleReward,
}: Props) {
  const t = useTranslations('pos')
  const tRewards = useTranslations('rewards')
  const currency = useCurrencyDisplay()
  const [method, setMethod] = useState<PaymentMethod>('cash')
  // null = "the exact amount due" (follows the total if the points change).
  const [cashInput, setCashInput] = useState<string | null>(null)
  const [splitCash, setSplitCash] = useState('')
  const [showPad, setShowPad] = useState(false)

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const redeemPointsNum = Math.min(parseInt(redeemPoints || '0', 10) || 0, availablePoints)
  const selectedRewards = availableRewards.filter((r) => selectedRewardIds.includes(r.id))

  // Points are taken off BEFORE tax by the server, so the amount due is
  // recomputed with the same arithmetic (calcCart mirrors pos.engine) instead
  // of simply subtracting from the total.
  const pointsDiscount = redeemPointsNum > 0 ? round2(redeemPointsNum * redemptionValue) : 0
  const priced = pointsDiscount > 0
    ? calcCart(cart.items, cart.tax_rate, cart.coupon_discount_amount + pointsDiscount, cart.tax_inclusive)
    : cart
  const due = priced.total
  const totalDiscount = priced.coupon_discount_amount

  const cashTendered = cashInput ?? due.toFixed(2)
  const tenderedNum = parseFloat(cashTendered)
  const change = method === 'cash' && tenderedNum >= due ? round2(tenderedNum - due) : 0
  const stillDue = method === 'cash' && !isNaN(tenderedNum) && tenderedNum < due ? round2(due - tenderedNum) : 0

  // An implausibly large cash amount is almost always a typing slip (e.g. a
  // phone number in the amount box): change over 1,000 AND more than 10x the
  // amount due. The cashier must tick "the amount is correct" for THAT amount
  // before paying; changing the amount asks again.
  const abnormalCash = method === 'cash' && change > 1000 && tenderedNum > due * 10
  const [confirmedAbnormal, setConfirmedAbnormal] = useState<number | null>(null)
  const abnormalConfirmed = abnormalCash && confirmedAbnormal === tenderedNum

  const splitCashNum = parseFloat(splitCash)
  const splitCard = method === 'split' && splitCashNum < due ? round2(due - splitCashNum) : 0

  // Round-up suggestions that make sense for THIS amount (exact + next
  // round figures), instead of a fixed list.
  const quickAmounts = (() => {
    const set = new Set<number>()
    for (const step of [5, 10, 20, 50, 100, 200, 500]) {
      const v = Math.ceil(due / step) * step
      if (v > due + 0.001) set.add(v)
    }
    return [...set].sort((a, b) => a - b).slice(0, 5)
  })()

  const canConfirm = () => {
    if (isSubmitting) return false
    if (method === 'cash') return tenderedNum >= due && (!abnormalCash || abnormalConfirmed)
    if (method === 'split') return !isNaN(splitCashNum) && splitCashNum > 0 && splitCashNum < due
    return true
  }

  const handleConfirm = () => {
    const data: PaymentData = {
      method,
      cash_tendered: method === 'cash' ? tenderedNum : undefined,
      change: method === 'cash' ? change : undefined,
      split_cash: method === 'split' ? splitCashNum : undefined,
      split_card: method === 'split' ? splitCard : undefined,
      redeem_points: redeemPointsNum > 0 ? redeemPointsNum : undefined,
      redeem_reward_instance_ids: selectedRewards.length > 0 ? selectedRewards.map((r) => r.id) : undefined,
    }
    onConfirm(data)
  }

  const press = (key: string) => {
    const base = due.toFixed(2)
    setCashInput((prev) => {
      // First digit typed over the auto-filled amount replaces it.
      const cur = prev ?? (key === 'back' ? base : '')
      if (key === 'back') return cur.slice(0, -1)
      if (key === 'clear') return ''
      if (key === '.') return cur.includes('.') ? cur : (cur === '' ? '0.' : cur + '.')
      return cur + key
    })
  }

  const setPoints = (n: number) => {
    const clamped = Math.max(0, Math.min(n, availablePoints))
    onRedeemPointsChange(clamped > 0 ? String(clamped) : '')
  }

  const taxPercent = Number((cart.tax_rate * 100).toFixed(2))

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="flex max-h-[min(70dvh,540px)] w-full max-w-lg lg:max-w-2xl flex-col overflow-hidden rounded-2xl border border-posCloud-border bg-posCloud-background shadow-xl dark:border-posCloudDark-border dark:bg-posCloudDark-background">
        {/* Header: title + close only (no print before payment, and the
            invoice number does not exist until the order is created). */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-posCloud-border bg-posCloud-surface px-3 py-2 dark:border-posCloudDark-border dark:bg-posCloudDark-surface">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-posCloud-primary-light text-posCloud-primary dark:bg-posCloud-primary/15">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <h3 className={`truncate text-base font-extrabold ${strong}`}>{t('payment.title')}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('payment.cancel')}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-posCloud-border hover:bg-slate-50 dark:border-posCloudDark-border dark:hover:bg-white/5 ${muted}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body. Side by side on desktop (order summary first, payment second);
            on narrow screens the payment comes first and the summary below. */}
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div className="flex flex-col-reverse lg:flex-row">
            {/* Order summary (read-only) */}
            <div className="space-y-3 p-2.5 lg:w-[42%] lg:shrink-0">
              {customer && (
                <div className={`flex items-center gap-2 p-2.5 ${card}`}>
                  <User className="h-4 w-4 shrink-0 text-posCloud-primary" />
                  <span className={`min-w-0 flex-1 truncate text-sm font-medium ${strong}`}>{customer.full_name || '—'}</span>
                  {customer.phone && customer.phone !== customer.full_name && <span className={`shrink-0 text-xs ${muted}`} dir="ltr">{customer.phone}</span>}
                </div>
              )}

              <div className={card}>
                <div className={`flex items-center gap-2 border-b border-posCloud-border px-3 py-2.5 text-sm font-bold dark:border-posCloudDark-border ${strong}`}>
                  <ShoppingCart className="h-4 w-4 text-posCloud-primary" />
                  {t('payment.productsCount', { count: cart.items.length })}
                </div>
                <div className="max-h-[26vh] divide-y divide-posCloud-border overflow-y-auto [scrollbar-width:thin] dark:divide-posCloudDark-border">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 px-3 py-2">
                      <LineImage cartItem={item} />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[13px] font-semibold ${strong}`}>{item.name}</p>
                        <p className={`truncate text-xs ${muted}`} dir="ltr">
                          {item.variant_name ? `${item.variant_name} · ` : ''}{fmt(item.unit_price)} × {item.quantity}
                        </p>
                      </div>
                      <span className={`shrink-0 text-sm font-bold ${strong}`}>{fmt(item.total_price)} <span className={`text-[11px] font-medium ${muted}`}>{currency}</span></span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 border-t border-posCloud-border px-3 py-2.5 text-sm dark:border-posCloudDark-border">
                  <div className={`flex justify-between gap-2 ${muted}`}>
                    <span>{t('subtotal')}</span><span>{fmt(priced.subtotal)} {currency}</span>
                  </div>
                  <div className={`flex justify-between gap-2 ${muted}`}>
                    <span>{cart.tax_inclusive ? t('taxMode.inclusive') : t('tax')} ({taxPercent}%)</span>
                    <span className="shrink-0">{fmt(priced.tax_amount)} {currency}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between gap-2 text-posCloud-success">
                      <span>{t('discount')}</span><span>−{fmt(totalDiscount)} {currency}</span>
                    </div>
                  )}
                </div>
                <div className="m-2 flex items-center justify-between gap-2 rounded-xl bg-posCloud-primary-light px-3 py-2.5 dark:bg-posCloud-primary/15">
                  <span className={`text-sm font-bold ${strong}`}>{t('total')}</span>
                  <span className="text-lg font-extrabold text-posCloud-primary">{fmt(due)} <span className="text-sm font-bold">{currency}</span></span>
                </div>
              </div>

              {availablePoints > 0 && (
                <div className={`space-y-2.5 p-3 ${card}`}>
                  <div className={`flex items-center gap-2 text-sm font-bold ${strong}`}>
                    <Gift className="h-4 w-4 text-posCloud-warning" />
                    {t('payment.redeemPoints')}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={`flex items-center gap-1.5 ${muted}`}>
                      <Coins className="h-4 w-4" />
                      {t('payment.availablePoints', { points: availablePoints })}
                    </span>
                    <label className="flex cursor-pointer items-center gap-2">
                      <span className={`font-medium ${strong}`}>{t('payment.usePoints')}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={redeemPointsNum > 0}
                        onClick={() => setPoints(redeemPointsNum > 0 ? 0 : availablePoints)}
                        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${redeemPointsNum > 0 ? 'bg-posCloud-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${redeemPointsNum > 0 ? 'start-[18px]' : 'start-0.5'}`} />
                      </button>
                    </label>
                  </div>
                  {redeemPointsNum > 0 && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-lg border border-posCloud-border dark:border-posCloudDark-border">
                          <button type="button" onClick={() => setPoints(redeemPointsNum - 1)} className="flex h-8 w-8 items-center justify-center text-posCloud-primary" aria-label="−">
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={redeemPoints}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/[^0-9]/g, '')
                              setPoints(digits === '' ? 0 : parseInt(digits, 10))
                            }}
                            className={`h-8 w-12 bg-transparent text-center text-sm font-semibold outline-none ${strong}`}
                          />
                          <button type="button" onClick={() => setPoints(redeemPointsNum + 1)} className="flex h-8 w-8 items-center justify-center text-posCloud-primary" aria-label="+">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className={`text-xs ${muted}`}>{t('payment.pointsUnit')}</span>
                        <span className="rounded-full bg-posCloud-primary-light px-2.5 py-1 text-xs font-semibold text-posCloud-primary dark:bg-posCloud-primary/15">
                          {t('payment.pointsDiscount')} {fmt(pointsDiscount)} {currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-posCloud-success-light px-3 py-2 dark:bg-posCloud-success/15">
                        <span className="text-sm font-bold text-posCloud-success">{t('payment.afterDiscount')}</span>
                        <span className="text-lg font-extrabold text-posCloud-success">{fmt(due)} {currency}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {availableRewards.length > 0 && (
                <div className={`space-y-1.5 p-3 ${card}`}>
                  <div className={`flex items-center justify-between gap-2 text-sm font-bold ${strong}`}>
                    <span className="flex items-center gap-2"><Gift className="h-4 w-4 text-posCloud-primary" />{tRewards('pos.sectionLabel')}</span>
                    <span className={`text-xs font-medium ${muted}`}>
                      {selectedRewards.length > 0 ? selectedRewards.length : tRewards('pos.availableCount', { count: availableRewards.length })}
                    </span>
                  </div>
                  {availableRewards.map((instance) => (
                    <label key={instance.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-xs text-posCloud-text-secondary hover:bg-posCloud-background dark:text-posCloudDark-text-secondary dark:hover:bg-posCloudDark-background">
                      <input
                        type="checkbox"
                        checked={selectedRewardIds.includes(instance.id)}
                        onChange={() => onToggleReward?.(instance.id)}
                        className="h-3.5 w-3.5 rounded border-posCloud-border accent-posCloud-primary dark:border-posCloudDark-border"
                      />
                      {instance.reward_definitions?.name ?? '—'}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="min-w-0 flex-1 space-y-2 p-2.5 lg:border-s lg:border-posCloud-border dark:lg:border-posCloudDark-border">
              <div className={`flex items-center gap-2 text-sm font-bold ${strong}`}>
                <CreditCard className="h-4 w-4 text-posCloud-primary" />
                {t('payment.methodLabel')}
              </div>
              <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
                {METHODS.filter((m) => m.id === 'cash' || !enabledMethods || enabledMethods.includes(m.id)).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-1.5 text-xs font-medium transition-all ${
                      method === m.id
                        ? 'border-posCloud-primary bg-posCloud-primary-light text-posCloud-primary shadow-sm dark:bg-posCloud-primary/15'
                        : 'border-posCloud-border bg-posCloud-surface text-posCloud-text-secondary hover:border-posCloud-primary/50 dark:border-posCloudDark-border dark:bg-posCloudDark-surface dark:text-posCloudDark-text-secondary'
                    }`}
                  >
                    <MethodMark id={m.id} />
                    <span className="w-full truncate text-center">{t(m.labelKey as Parameters<typeof t>[0])}</span>
                  </button>
                ))}
              </div>

              {method === 'cash' && (
                <div className={`space-y-2 p-2.5 ${card}`}>
                  <div>
                    <label className={`mb-1 block text-[11px] font-medium ${muted}`}>{t('payment.tendered')}</label>
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-posCloud-border bg-posCloud-background px-3 focus-within:border-posCloud-primary dark:border-posCloudDark-border dark:bg-posCloudDark-background">
                        <span className={`shrink-0 text-xs ${muted}`}>{currency}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder={fmt(due)}
                          value={cashTendered}
                          onChange={(e) => setCashInput(e.target.value)}
                          className={`min-w-0 flex-1 bg-transparent text-center text-base font-bold outline-none ${strong}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPad((v) => !v)}
                        aria-label={t('payment.keypad')}
                        title={t('payment.keypad')}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${showPad ? 'border-posCloud-primary bg-posCloud-primary-light text-posCloud-primary' : 'border-posCloud-border text-posCloud-primary hover:bg-posCloud-primary-light dark:border-posCloudDark-border'}`}
                      >
                        <Calculator className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {showPad && (
                    <div className="grid grid-cols-4 gap-1.5" dir="ltr">
                      {['7', '8', '9', 'back', '4', '5', '6', 'clear', '1', '2', '3', '.', '0'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => press(k)}
                          className={`flex h-8 items-center justify-center rounded-lg border border-posCloud-border bg-posCloud-background text-sm font-semibold hover:bg-posCloud-primary-light dark:border-posCloudDark-border dark:bg-posCloudDark-background ${k === 'clear' ? 'text-posCloud-danger' : strong} ${k === '0' ? 'col-span-3' : ''}`}
                        >
                          {k === 'back' ? <Delete className="h-4 w-4" /> : k === 'clear' ? 'C' : k}
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap gap-1" dir="ltr" aria-label={t('payment.quickAmounts')}>
                      {[due, ...quickAmounts].map((v, i) => {
                        const active = !isNaN(tenderedNum) && Math.abs(tenderedNum - v) < 0.005
                        return (
                          <button
                            key={`${v}-${i}`}
                            type="button"
                            onClick={() => setCashInput(v.toFixed(2))}
                            className={`min-w-[44px] rounded-md border px-2 py-1 text-xs font-semibold transition-colors ${
                              active
                                ? 'border-posCloud-primary bg-posCloud-primary text-white'
                                : 'border-posCloud-border bg-posCloud-background text-posCloud-text-secondary hover:border-posCloud-primary/50 dark:border-posCloudDark-border dark:bg-posCloudDark-background dark:text-posCloudDark-text-secondary'
                            }`}
                          >
                            {i === 0 ? t('payment.exactAmount') : v}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className={`flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 ${
                    stillDue > 0
                      ? 'bg-posCloud-warning-light text-posCloud-warning dark:bg-posCloud-warning/15'
                      : 'bg-posCloud-success-light text-posCloud-success dark:bg-posCloud-success/15'
                  }`}>
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <Coins className="h-4 w-4" />
                      {stillDue > 0 ? t('payment.stillDue') : t('payment.changeDue')}
                    </span>
                    <span className="text-base font-extrabold">{fmt(stillDue > 0 ? stillDue : change)} {currency}</span>
                  </div>

                  {abnormalCash && (
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-posCloud-warning/40 bg-posCloud-warning-light p-2.5 text-xs dark:bg-posCloud-warning/15">
                      <input
                        type="checkbox"
                        checked={abnormalConfirmed}
                        onChange={(e) => setConfirmedAbnormal(e.target.checked ? tenderedNum : null)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-posCloud-warning"
                      />
                      <span className={strong}>
                        <b>{t('payment.abnormalAmount', { change: `${fmt(change)} ${currency}` })}</b>
                        <span className="mt-0.5 block font-medium">{t('payment.abnormalConfirm')}</span>
                      </span>
                    </label>
                  )}
                </div>
              )}

              {method === 'split' && (
                <div className={`space-y-2 p-3 ${card}`}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <label className={`font-medium ${muted}`}>{t('payment.splitCash')}</label>
                    {splitCard > 0 && <span className="font-medium text-posCloud-primary">{t('payment.splitCard')}: {fmt(splitCard)} {currency}</span>}
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className={`h-9 w-full rounded-lg border border-posCloud-border bg-posCloud-background text-center text-base font-bold outline-none focus:border-posCloud-primary dark:border-posCloudDark-border dark:bg-posCloudDark-background ${strong}`}
                  />
                </div>
              )}

              {method !== 'cash' && method !== 'split' && (
                <div className={`flex items-center gap-3 p-3 ${card}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-posCloud-success-light text-posCloud-success dark:bg-posCloud-success/15">
                    <Check className="h-5 w-5" />
                  </span>
                  <p className={`text-sm ${strong}`}>{t('payment.collectNote', { amount: `${fmt(due)} ${currency}` })}</p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-posCloud-danger/20 bg-posCloud-danger-light p-2.5 text-xs text-posCloud-danger dark:bg-posCloud-danger/15">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer pinned under both columns */}
        <div className="flex shrink-0 gap-2 border-t border-posCloud-border bg-posCloud-surface p-2 dark:border-posCloudDark-border dark:bg-posCloudDark-surface">
          <Button variant="outline" onClick={onClose} className="min-w-0 flex-1 gap-1.5 px-2 sm:gap-2 sm:px-4">
            <X className="h-4 w-4" />
            {t('payment.cancel')}
          </Button>
          <Button
            disabled={!canConfirm()}
            onClick={handleConfirm}
            className="min-w-0 flex-[2] gap-1.5 whitespace-nowrap rounded-xl px-2 text-sm font-bold sm:gap-2 sm:px-4 sm:text-base"
          >
            {isSubmitting ? t('common.processing') : (
              <>
                <span>{t('payment.confirm')}</span>
                <span>{fmt(due)} {currency}</span>
                <Check className="hidden h-4 w-4 min-[400px]:block" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
