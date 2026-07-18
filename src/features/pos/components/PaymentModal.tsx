'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, ImageOff, Banknote, Wallet as WalletIcon, Apple, Printer, Check } from 'lucide-react'
import Image from 'next/image'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { Cart, CartItem, PaymentData, PaymentMethod } from '../types/pos.types'
import type { Customer } from '@/features/customers/types/customer.types'
import { Button } from '@/shared/ui/button'

// Same temporary stand-in-photo technique already used in CartPanel/ItemGrid
// (see PARKING_LOT.md B3) — real product name, locked to the cart-item id.
function lineImageUrl(cartItem: CartItem) {
  return `https://loremflickr.com/60/60/${encodeURIComponent(cartItem.name)}?lock=${cartItem.item_id}`
}

function LineImage({ cartItem }: { cartItem: CartItem }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-posCloud-background dark:bg-posCloudDark-background">
        <ImageOff className="h-4 w-4 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" strokeWidth={1.5} />
      </div>
    )
  }
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-posCloud-background dark:bg-posCloudDark-background">
      <Image
        src={lineImageUrl(cartItem)}
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

// Brand-styled marks (not official trademarked logo files — recognizable
// approximations built from CSS/wordmarks/lucide icons) rather than a single
// generic card icon for every network, per explicit user request to make
// each method visually distinguishable like a real POS terminal.
function MethodMark({ id }: { id: PaymentMethod }) {
  switch (id) {
    case 'cash':
      return <Banknote className="h-5 w-5" />
    case 'mada':
      return (
        <span dir="ltr" className="flex h-5 items-center gap-[1px] text-[13px] font-black italic tracking-tighter">
          <span className="text-[#00847E]">m</span>
          <span className="text-[#54B948]">a</span>
          <span className="text-[#00847E]">d</span>
          <span className="text-[#54B948]">a</span>
        </span>
      )
    case 'visa':
      return <span dir="ltr" className="text-[15px] font-black italic tracking-tighter text-[#1A1F71]">VISA</span>
    case 'mastercard':
      return (
        <span dir="ltr" className="flex h-5 items-center">
          <span className="h-4 w-4 rounded-full bg-[#EB001B]" />
          <span className="-ms-1.5 h-4 w-4 rounded-full bg-[#F79E1B] opacity-90" />
        </span>
      )
    case 'apple_pay':
      return (
        <span dir="ltr" className="flex items-center gap-0.5">
          <Apple className="h-4 w-4 fill-current" />
          <span className="text-[13px] font-semibold">Pay</span>
        </span>
      )
    case 'stc_pay':
      return (
        <span dir="ltr" className="text-[12px] font-black tracking-tight">
          <span className="text-[#4B0F73]">STC</span>{' '}
          <span className="italic text-[#84BD00]">pay</span>
        </span>
      )
    case 'wallet':
      return <WalletIcon className="h-5 w-5" />
    case 'split':
      return (
        <span dir="ltr" className="flex items-center gap-0.5">
          <Banknote className="h-4 w-4" />
          <span className="text-xs font-bold">+</span>
          <span className="h-4 w-5 rounded-sm border-2 border-current" />
        </span>
      )
    default:
      return null
  }
}

export function PaymentModal({
  cart, customer, onConfirm, onClose, isSubmitting, error,
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
    if (method === 'split') {
      const c = parseFloat(splitCash)
      return !isNaN(c) && c > 0 && c < remainingDue
    }
    return true
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

  const totalDiscount = cart.coupon_discount_amount + giftCardAmountNum

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center px-4 py-[50px]">
      {/* Two-column layout matching the reference exactly: wide item table on
          one side, totals/gift-card/loyalty/payment-method on the other,
          both bounded to the modal height and independently scrollable. No
          fake order number shown (no real invoice exists until the order is
          actually created) and no "bank transfer" button (no matching
          backend payment_method value — see METHODS comment below). */}
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-posCloud-border bg-posCloud-surface shadow-xl dark:border-posCloudDark-border dark:bg-posCloudDark-surface">
        <div className="shrink-0 border-b border-posCloud-border px-5 pb-3 pt-4 dark:border-posCloudDark-border">
          <div className="flex items-center justify-between gap-3">
            <button onClick={onClose} className="shrink-0 rounded p-1.5 opacity-70 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
            <h3 className="flex-1 text-center font-bold text-lg text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('payment.title')}</h3>
            <button onClick={() => window.print()} className="shrink-0 rounded p-1.5 opacity-70 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:opacity-100 transition-opacity">
              <Printer className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
            <span>{t('payment.customer')}</span>
            <span className="font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">
              {customer?.full_name || t('payment.generalCustomer')}
            </span>
          </div>
        </div>

        {/* No flex-1 / forced row height here on purpose. The row is sized by
            its content — specifically by the right column, which has no
            scroll and must always render in full. Flexbox (not CSS Grid) on
            purpose: Grid's single-column auto-row-sizing collapsed the left
            column to 0 height on narrower desktop widths, because the row
            container itself had no shrink-0 and got compressed by the
            modal's flex-col budget before grid could size its rows from
            content. Flexbox's shrink/grow model handles this correctly in
            both directions — the right column is shrink-0 (protected, full
            content, never touched) on every screen size, and the left
            column is flex-1 min-h-0, so its own inner overflow-y-auto (the
            ONE legitimate scrollbar in this modal) is always the thing that
            absorbs whatever space is left, whether columns are side-by-side
            (lg:flex-row) or stacked (flex-col on mobile). */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Left: item table — the only scrollable region in the body */}
          <div className="flex min-h-0 flex-1 flex-col border-posCloud-border dark:border-posCloudDark-border lg:border-e">
            <p className="shrink-0 px-5 pt-4 text-xs font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
              {t('payment.productsCount', { count: cart.items.length })}
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-posCloud-surface dark:bg-posCloudDark-surface">
                  <tr className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                    <th className="py-2 text-start font-medium">{t('payment.product')}</th>
                    <th className="py-2 text-center font-medium">{t('payment.quantity')}</th>
                    <th className="py-2 text-center font-medium">{t('payment.price')}</th>
                    <th className="py-2 text-end font-medium">{t('payment.lineTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.id} className="border-t border-posCloud-border dark:border-posCloudDark-border">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <LineImage cartItem={item} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{item.name}</p>
                            {item.variant_name && <p className="truncate text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{item.variant_name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 text-center text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{item.quantity}</td>
                      <td className="py-2 text-center text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{fmt(item.unit_price)}</td>
                      <td className="py-2 text-end font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{fmt(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: totals, gift card, loyalty, payment method, amount —
              shrink-0 so it's never compressed; never scrolls, compact
              enough to always fit in full. */}
          <div className="w-full shrink-0 space-y-1 p-2.5 pb-3 lg:w-[320px]">
            <div className="space-y-0.5 text-sm">
              <div className="flex justify-between text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                <span>{t('subtotal')}</span><span>{fmt(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                <span>{t('tax')}</span><span>{fmt(cart.tax_amount)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-posCloud-success">
                  <span>{t('discount')}</span><span>−{fmt(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-posCloud-border pt-1.5 text-base font-bold dark:border-posCloudDark-border">
                <span className="text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('total')}</span>
                <span className="text-posCloud-primary">{fmt(remainingDue)} {currency}</span>
              </div>
            </div>

            {/* Confirmed-method summary — compact single line, not a padded card. */}
            <div className="flex items-center justify-between rounded-lg border border-posCloud-success/30 bg-posCloud-success-light px-2.5 py-1.5 dark:bg-posCloud-success/15">
              <span className="flex items-center gap-1.5 text-xs font-medium text-posCloud-success">
                <MethodMark id={method} />
                {t(METHODS.find((m) => m.id === method)!.labelKey as Parameters<typeof t>[0])}
              </span>
              <Check className="h-3.5 w-3.5 text-posCloud-success" />
            </div>

            <div className="rounded-lg border border-posCloud-info/20 bg-posCloud-info-light p-2 dark:bg-posCloud-info/15">
              {giftCardApplied ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-posCloud-info">
                    {t('payment.giftCardApplied')}: <span className="font-mono">{giftCardCode}</span> (−{fmt(giftCardAmountNum)})
                  </span>
                  <button onClick={onRemoveGiftCard} className="shrink-0 text-xs text-posCloud-danger hover:brightness-95">
                    {t('payment.giftCardRemove')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex h-8 w-full overflow-hidden rounded-lg border border-posCloud-info/30">
                    <input
                      type="text"
                      placeholder={t('payment.giftCardCode')}
                      value={giftCardCode}
                      onChange={(e) => onGiftCardCodeChange(e.target.value.toUpperCase())}
                      className="h-full min-w-0 flex-1 border-0 bg-posCloud-surface px-2 text-xs uppercase text-posCloud-text-primary outline-none focus:bg-posCloud-info-light/40 dark:bg-posCloudDark-surface dark:text-posCloudDark-text-primary"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={giftCardAmount}
                      onChange={(e) => onGiftCardAmountChange(e.target.value)}
                      className="h-full w-12 shrink-0 border-0 border-s border-posCloud-info/30 bg-posCloud-surface px-1 text-center text-xs text-posCloud-text-primary outline-none focus:bg-posCloud-info-light/40 dark:bg-posCloudDark-surface dark:text-posCloudDark-text-primary"
                    />
                    <button
                      disabled={!giftCardCode.trim() || !(parseFloat(giftCardAmount) > 0) || validatingGiftCard}
                      onClick={onApplyGiftCard}
                      className="h-full shrink-0 border-0 border-s border-posCloud-info/30 bg-posCloud-info px-2.5 text-xs font-medium text-white hover:brightness-95 disabled:opacity-50"
                    >
                      {validatingGiftCard ? t('checking') : t('payment.giftCardApply')}
                    </button>
                  </div>
                  {giftCardError && <p className="text-xs text-posCloud-danger">{giftCardError}</p>}
                </>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-posCloud-danger/20 bg-posCloud-danger-light p-2 text-xs text-posCloud-danger dark:bg-posCloud-danger/15">
                {error}
              </div>
            )}

            {availablePoints > 0 && (
              <div className="space-y-1.5 rounded-lg border border-posCloud-warning/20 bg-posCloud-warning-light p-2.5 dark:bg-posCloud-warning/15">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-posCloud-warning">{t('payment.redeemPoints')}</span>
                  <span className="text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                    {t('payment.availablePoints', { points: availablePoints })}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={redeemPoints}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/[^0-9]/g, '')
                    const clamped = digitsOnly === '' ? '' : String(Math.min(parseInt(digitsOnly, 10), availablePoints))
                    onRedeemPointsChange(clamped)
                  }}
                  className="h-8 w-full rounded-lg border border-posCloud-warning/30 bg-posCloud-surface text-center text-xs text-posCloud-text-primary outline-none focus:border-posCloud-warning dark:bg-posCloudDark-surface dark:text-posCloudDark-text-primary"
                />
              </div>
            )}

            <p className="text-xs font-medium text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('payment.methodLabel')}</p>
            <div className="grid grid-cols-4 gap-1">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border py-1 text-[10px] font-medium transition-all ${
                    method === m.id
                      ? 'border-posCloud-primary bg-posCloud-primary-light text-posCloud-primary dark:bg-posCloud-primary/15'
                      : 'border-posCloud-border bg-posCloud-background text-posCloud-text-tertiary hover:border-posCloud-primary/50 dark:border-posCloudDark-border dark:bg-posCloudDark-background'
                  }`}
                >
                  <MethodMark id={m.id} />
                  {t(m.labelKey as Parameters<typeof t>[0])}
                </button>
              ))}
            </div>

            {method === 'cash' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('payment.tendered')}</label>
                  {change > 0 && <span className="text-posCloud-success">{t('payment.change')}: {fmt(change)} {currency}</span>}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={fmt(remainingDue)}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full h-9 text-center text-base font-bold rounded-lg border border-posCloud-border bg-posCloud-background text-posCloud-text-primary outline-none focus:border-posCloud-primary dark:border-posCloudDark-border dark:bg-posCloudDark-background dark:text-posCloudDark-text-primary"
                />
              </div>
            )}

            {method === 'split' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary">{t('payment.splitCash')}</label>
                  {splitCard > 0 && <span className="text-posCloud-primary font-medium">{t('payment.splitCard')}: {fmt(splitCard)} {currency}</span>}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                  className="w-full h-9 text-center rounded-lg border border-posCloud-border bg-posCloud-background text-posCloud-text-primary outline-none focus:border-posCloud-primary dark:border-posCloudDark-border dark:bg-posCloudDark-background dark:text-posCloudDark-text-primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer — full width, pinned under both columns */}
        <div className="flex shrink-0 gap-3 border-t border-posCloud-border p-3 dark:border-posCloudDark-border">
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
