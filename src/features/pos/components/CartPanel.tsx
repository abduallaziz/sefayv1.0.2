'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { User, X, ChevronDown, ChevronLeft, ImageOff, Tag, Sparkles, List, PenLine, PauseCircle } from 'lucide-react'
import Image from 'next/image'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { couponsApi } from '@/features/coupons/api/coupons.api'
import { Cart, CartItem } from '../types/pos.types'
import type { Customer } from '@/features/customers/types/customer.types'
import type { NotePreset } from '@/features/note-presets/api/note-presets.api'
import { Button } from '@/shared/ui/button'

// Shared collapsed/expanded row shape for coupon / loyalty points —
// same icon+label+chevron shell, only the expanded body differs per section.
function AccordionRow({
  icon: Icon, label, sublabel, applied, expanded, onToggle, children,
}: {
  icon: React.ElementType
  label: string
  sublabel?: string
  applied?: boolean
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-t border-posCloud-border dark:border-posCloudDark-border py-2.5 first:border-t-0 first:pt-0">
      <button onClick={onToggle} className="flex w-full items-center gap-2.5 text-start">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${applied ? 'bg-posCloud-success-light text-posCloud-success' : 'bg-posCloud-background text-posCloud-text-tertiary dark:bg-posCloudDark-background'}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{label}</span>
          {sublabel && <span className="block text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{sublabel}</span>}
        </span>
        <ChevronLeft className={`h-4 w-4 shrink-0 text-posCloud-text-tertiary transition-transform ${expanded ? '-rotate-90' : ''}`} />
      </button>
      {expanded && <div className="mt-2.5 ps-[42px]">{children}</div>}
    </div>
  )
}

// Same temporary stand-in-photo technique as ItemGrid (see PARKING_LOT.md B3) —
// keyed by the line's real product name, locked to its cart-item id.
function cartItemImageUrl(cartItem: CartItem) {
  return `https://loremflickr.com/80/80/${encodeURIComponent(cartItem.name)}?lock=${cartItem.item_id}`
}

function CartLineImage({ cartItem }: { cartItem: CartItem }) {
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
        src={cartItemImageUrl(cartItem)}
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

// Manual typing needs its own local buffer so the field can hold a
// transient/invalid state while the cashier is mid-edit (e.g. cleared to
// type a new number) without fighting the controlled `item.quantity` prop
// on every keystroke. Commits (calls onChange) on blur or Enter; reverts
// to the last real quantity if left empty or non-numeric.
function QtyInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [local, setLocal] = useState(String(value))

  useEffect(() => {
    setLocal(String(value))
  }, [value])

  const commit = () => {
    const n = parseInt(local, 10)
    if (Number.isFinite(n) && n > 0) {
      onChange(n)
    } else {
      setLocal(String(value))
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={local}
      onChange={(e) => setLocal(e.target.value.replace(/[^0-9]/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit()
          e.currentTarget.blur()
        }
      }}
      className="w-7 shrink-0 bg-transparent text-center text-sm font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary outline-none"
    />
  )
}

const VISIBLE_ROWS = 5
const ROW_HEIGHT_PX = 52

interface Props {
  cart: Cart
  onUpdateQty: (cartId: string, qty: number) => void
  onRemoveItem: (cartId: string) => void
  onApplyCoupon: (coupon: string, discountAmount: number) => void
  onClearCoupon: () => void
  onCheckout: () => void
  onClear: () => void
  onHold?: () => void
  isHolding?: boolean
  customerCaptureEnabled?: boolean
  selectedCustomer?: Customer | null
  onClearCustomer?: () => void
  loyaltyEnabled?: boolean
  availablePoints: number
  redeemPoints: string
  onRedeemPointsChange: (v: string) => void
  notePresets: NotePreset[]
  noteTab: 'list' | 'custom'
  onNoteTabChange: (tab: 'list' | 'custom') => void
  selectedPresetIds: string[]
  onTogglePreset: (id: string) => void
  customNote: string
  onCustomNoteChange: (v: string) => void
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function CartPanel({
  cart, onUpdateQty, onRemoveItem, onApplyCoupon, onClearCoupon, onCheckout, onClear,
  onHold, isHolding,
  customerCaptureEnabled, selectedCustomer, onClearCustomer,
  loyaltyEnabled, availablePoints, redeemPoints, onRedeemPointsChange,
  notePresets, noteTab, onNoteTabChange, selectedPresetIds, onTogglePreset, customNote, onCustomNoteChange,
}: Props) {
  const t = useTranslations('pos')
  const tNotes = useTranslations('notePresets')
  const currency = useCurrencyDisplay()
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [showAllItems, setShowAllItems] = useState(false)
  const [openSection, setOpenSection] = useState<'coupon' | 'loyalty' | 'notes' | null>(null)
  const toggleSection = (key: 'coupon' | 'loyalty' | 'notes') =>
    setOpenSection((prev) => (prev === key ? null : key))

  const hiddenCount = Math.max(0, cart.items.length - VISIBLE_ROWS)
  const visibleItems = showAllItems ? cart.items : cart.items.slice(0, VISIBLE_ROWS)

  // يتحقق فعليًا من الكود عبر /coupons/validate قبل قبوله — لا يُعرَض كمطبَّق أبدًا
  // إلا بعد تأكيد صحته ومبلغ خصمه الحقيقي من السيرفر.
  const handleApplyCoupon = async () => {
    const coupon = couponInput.trim()
    if (!coupon || cart.subtotal <= 0) return
    setValidatingCoupon(true)
    setCouponError(null)
    try {
      const result = await couponsApi.validate(coupon, cart.subtotal)
      onApplyCoupon(result.code, result.discount_amount)
      setCouponInput('')
    } catch (e: any) {
      setCouponError(e?.message ?? t('couponInvalid'))
    } finally {
      setValidatingCoupon(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[15px] text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('currentOrder')}</h2>
        {cart.items.length > 0 && (
          <button onClick={onClear} className="text-xs text-posCloud-danger hover:brightness-90">
            {t('clearAll')}
          </button>
        )}
      </div>

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
          <span className="text-4xl mb-2">🛒</span>
          <p className="text-sm">{t('noItems')}</p>
        </div>
      ) : (
        <div className="mb-3 flex flex-col">
          <div
            className="space-y-2 overflow-y-auto pe-1"
            style={{ maxHeight: `${VISIBLE_ROWS * ROW_HEIGHT_PX + (VISIBLE_ROWS - 1) * 8}px` }}
          >
            {visibleItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 rounded-xl bg-posCloud-background dark:bg-posCloudDark-background p-2">
                <button onClick={() => onRemoveItem(item.id)} className="shrink-0 text-posCloud-danger hover:brightness-90">
                  <X className="h-4 w-4" />
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                    className="w-6 h-6 rounded-md border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-secondary dark:text-posCloudDark-text-secondary text-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40"
                  >
                    +
                  </button>
                  <QtyInput value={item.quantity} onChange={(n) => onUpdateQty(item.id, n)} />
                  <button
                    onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                    className="w-6 h-6 rounded-md border border-posCloud-border dark:border-posCloudDark-border text-posCloud-text-secondary dark:text-posCloudDark-text-secondary text-sm flex items-center justify-center hover:bg-slate-100 dark:hover:bg-posCloudDark-border/40"
                  >
                    −
                  </button>
                </div>
                <div className="min-w-0 flex-1 text-end">
                  <p className="text-[13px] font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">{item.name}</p>
                  {item.variant_name && (
                    <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary truncate">{item.variant_name}</p>
                  )}
                  <p className="text-xs text-posCloud-primary font-medium">{fmt(item.unit_price)} {currency}</p>
                </div>
                <CartLineImage cartItem={item} />
              </div>
            ))}
          </div>
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAllItems((v) => !v)}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-posCloud-border dark:border-posCloudDark-border py-2 text-xs font-semibold text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllItems ? 'rotate-180' : ''}`} />
              {showAllItems ? t('showLess') : `${t('showMoreItems')} (${hiddenCount})`}
            </button>
          )}
        </div>
      )}

      {customerCaptureEnabled && selectedCustomer && (
        <div className="border-t border-posCloud-border dark:border-posCloudDark-border pt-3 mb-3">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-posCloud-background dark:bg-posCloudDark-background p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-posCloud-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary truncate">{selectedCustomer.full_name || '—'}</p>
                {selectedCustomer.phone && <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary" dir="ltr">{selectedCustomer.phone}</p>}
              </div>
            </div>
            <button onClick={onClearCustomer} className="text-posCloud-text-tertiary hover:text-posCloud-danger shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* الكود يُتحقَّق منه فعليًا عبر /coupons/validate وقت التطبيق —
          القيم الحقيقية (نسبة/مبلغ الخصم) تُجلَب من السيرفر، لا تُحدَّد يدويًا هنا أبدًا. */}
      <div className="border-t border-posCloud-border dark:border-posCloudDark-border pt-1 mb-3">
        <AccordionRow
          icon={Tag}
          label={cart.coupon_code ? `${t('couponCode')}: ${cart.coupon_code}` : t('addCoupon').replace('+ ', '')}
          sublabel={cart.coupon_discount_amount > 0 ? `−${fmt(cart.coupon_discount_amount)} ${currency}` : undefined}
          applied={!!cart.coupon_code}
          expanded={openSection === 'coupon'}
          onToggle={() => toggleSection('coupon')}
        >
          {cart.coupon_code ? (
            <button onClick={onClearCoupon} className="text-xs text-posCloud-danger hover:brightness-90">
              {t('removeCoupon')}
            </button>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  placeholder={t('couponCode')}
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
                  className="flex-1 min-w-0 rounded-full border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background px-3.5 py-2 text-xs uppercase text-posCloud-text-primary dark:text-posCloudDark-text-primary outline-none placeholder:normal-case placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim() || validatingCoupon}
                  className="shrink-0 rounded-full bg-posCloud-primary-light px-4 text-xs font-semibold text-posCloud-primary disabled:opacity-50"
                >
                  {validatingCoupon ? t('checking') : t('apply')}
                </button>
              </div>
              {couponError && <p className="text-[11px] text-posCloud-danger">{couponError}</p>}
            </div>
          )}
        </AccordionRow>

        {loyaltyEnabled && (
          <AccordionRow
            icon={Sparkles}
            label={t('payment.redeemPoints')}
            sublabel={t('payment.availablePoints', { points: availablePoints })}
            applied={!!redeemPoints && parseInt(redeemPoints, 10) > 0}
            expanded={openSection === 'loyalty'}
            onToggle={() => toggleSection('loyalty')}
          >
            <label className={`flex items-center gap-2 text-xs text-posCloud-text-secondary dark:text-posCloudDark-text-secondary ${availablePoints > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
              <input
                type="checkbox"
                disabled={availablePoints === 0}
                checked={!!redeemPoints && parseInt(redeemPoints, 10) > 0}
                onChange={(e) => onRedeemPointsChange(e.target.checked ? String(availablePoints) : '')}
                className="h-3.5 w-3.5 rounded border-posCloud-border dark:border-posCloudDark-border accent-posCloud-primary"
              />
              {t('payment.redeemPoints')} ({t('payment.availablePoints', { points: availablePoints })})
            </label>
          </AccordionRow>
        )}

        <AccordionRow
          icon={PenLine}
          label={tNotes('notesLabel')}
          sublabel={
            noteTab === 'custom'
              ? (customNote.trim() || undefined)
              : (selectedPresetIds.length > 0 ? `${selectedPresetIds.length}` : undefined)
          }
          applied={noteTab === 'custom' ? !!customNote.trim() : selectedPresetIds.length > 0}
          expanded={openSection === 'notes'}
          onToggle={() => toggleSection('notes')}
        >
          <div className="space-y-2">
            <div className="flex gap-1 rounded-lg bg-posCloud-background p-1 dark:bg-posCloudDark-background">
              <button
                onClick={() => onNoteTabChange('list')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${noteTab === 'list' ? 'bg-posCloud-surface text-posCloud-primary shadow-sm dark:bg-posCloudDark-surface' : 'text-posCloud-text-tertiary'}`}
              >
                <List className="h-3.5 w-3.5" />
                {tNotes('chooseFromList')}
              </button>
              <button
                onClick={() => onNoteTabChange('custom')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${noteTab === 'custom' ? 'bg-posCloud-surface text-posCloud-primary shadow-sm dark:bg-posCloudDark-surface' : 'text-posCloud-text-tertiary'}`}
              >
                <PenLine className="h-3.5 w-3.5" />
                {tNotes('writeNote')}
              </button>
            </div>

            {noteTab === 'list' ? (
              notePresets.length === 0 ? (
                <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{tNotes('noPresets')}</p>
              ) : (
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {notePresets.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-xs text-posCloud-text-secondary hover:bg-posCloud-background dark:text-posCloudDark-text-secondary dark:hover:bg-posCloudDark-background">
                      <input
                        type="checkbox"
                        checked={selectedPresetIds.includes(p.id)}
                        onChange={() => onTogglePreset(p.id)}
                        className="h-3.5 w-3.5 rounded border-posCloud-border dark:border-posCloudDark-border accent-posCloud-primary"
                      />
                      {p.text}
                    </label>
                  ))}
                </div>
              )
            ) : (
              <textarea
                value={customNote}
                onChange={(e) => onCustomNoteChange(e.target.value)}
                placeholder={tNotes('customPlaceholder')}
                rows={3}
                className="w-full resize-none rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background px-3 py-2 text-xs text-posCloud-text-primary dark:text-posCloudDark-text-primary outline-none placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"
              />
            )}
          </div>
        </AccordionRow>
      </div>

      <div className="space-y-1.5 text-xs border-t border-posCloud-border dark:border-posCloudDark-border pt-3 mb-3">
        <div className="flex justify-between text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
          <span>{t('subtotal')}</span>
          <span>{fmt(cart.subtotal)} {currency}</span>
        </div>
        {cart.coupon_discount_amount > 0 && (
          <div className="flex justify-between text-posCloud-success">
            <span>{t('discount')}</span>
            <span>−{fmt(cart.coupon_discount_amount)} {currency}</span>
          </div>
        )}
        <div className="flex justify-between text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
          <span>{t('tax')}</span>
          <span>{fmt(cart.tax_amount)} {currency}</span>
        </div>
        <div className="flex justify-between border-t border-posCloud-border dark:border-posCloudDark-border pt-2 text-base font-extrabold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
          <span>{t('total')}</span>
          <span>{fmt(cart.total)} {currency}</span>
        </div>
      </div>

      {onHold && (
        <button
          onClick={onHold}
          disabled={cart.items.length === 0 || isHolding}
          className="w-full mb-2 flex items-center justify-center gap-1.5 rounded-lg border border-posCloud-border dark:border-posCloudDark-border py-2.5 text-sm font-semibold text-posCloud-text-secondary dark:text-posCloudDark-text-secondary hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <PauseCircle className="w-4 h-4" />
          {t('heldOrders.holdButton')}
        </button>
      )}

      <Button
        size="lg"
        disabled={cart.items.length === 0}
        onClick={onCheckout}
        className="w-full"
      >
        {t('checkout')} — {fmt(cart.total)} {currency}
      </Button>
    </div>
  )
}
