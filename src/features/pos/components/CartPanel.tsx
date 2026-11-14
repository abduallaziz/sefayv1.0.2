'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { User, X, ChevronDown, Tag, List, PenLine, ShoppingCart, Trash2, Minus, Plus, Wallet, Clock, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { couponsApi } from '@/features/coupons/api/coupons.api'
import { ApiError } from '@/lib/api'
import { Cart, CartItem } from '../types/pos.types'
import type { Customer } from '@/features/customers/types/customer.types'
import type { NotePreset } from '@/features/note-presets/api/note-presets.api'
import { Button } from '@/shared/ui/button'
import { toast } from 'sonner'
import { MAX_LINE_QTY } from '../hooks/useCart'

// The line's photo: the product's own image, or (no photo / failed to load)
// the same calm tile with its first character that the product cards use.
// (The old stand-in photos fetched from a third-party site are gone.)
function CartLineImage({ cartItem }: { cartItem: CartItem }) {
  const [failed, setFailed] = useState(false)
  if (!cartItem.image_url || failed) {
    const initial = Array.from(cartItem.name.trim())[0]?.toUpperCase()
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-posCloud-primary-light text-xs font-bold text-posCloud-primary dark:bg-posCloud-primary/15">
        {initial}
      </div>
    )
  }
  return (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-posCloud-background dark:bg-posCloudDark-background">
      <Image
        src={cartItem.image_url}
        alt={cartItem.name}
        fill
        sizes="32px"
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
function QtyInput({ value, onChange, invalidMsg, maxMsg }: { value: number; onChange: (n: number) => void; invalidMsg: string; maxMsg: string }) {
  const [local, setLocal] = useState(String(value))
  // React's documented "adjusting state when a prop changes" pattern —
  // setState during render (not in an effect) when the prop diverges from
  // the last-seen value. React discards this render and re-renders
  // immediately with the update applied before anything commits, so there's
  // no extra commit/flicker, and it avoids `set-state-in-effect` for what is
  // really a render-time correction, not a side effect.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setLocal(String(value))
  }

  const commit = () => {
    const n = parseInt(local, 10)
    if (Number.isFinite(n) && n > MAX_LINE_QTY) {
      toast.error(maxMsg, { id: 'pos-qty-max' })
      onChange(MAX_LINE_QTY)
      setLocal(String(MAX_LINE_QTY))
    } else if (Number.isFinite(n) && n > 0) {
      onChange(n)
    } else {
      toast.error(invalidMsg, { id: 'pos-qty-invalid' })
      setLocal(String(value))
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={local}
      onChange={(e) => setLocal(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
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

interface Props {
  cart: Cart
  onUpdateQty: (cartId: string, qty: number) => void
  onRemoveItem: (cartId: string) => void
  workers?: { id: string; name: string }[]
  onSetWorker?: (cartId: string, workerId?: string) => void
  onApplyCoupon: (coupon: string, discountAmount: number) => void
  onClearCoupon: () => void
  onCheckout: () => void
  onClear: () => void
  onHold?: () => void
  isHolding?: boolean
  customerCaptureEnabled?: boolean
  selectedCustomer?: Customer | null
  onClearCustomer?: () => void
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
  cart, onUpdateQty, onRemoveItem, workers = [], onSetWorker, onApplyCoupon, onClearCoupon, onCheckout, onClear,
  onHold, isHolding,
  customerCaptureEnabled, selectedCustomer, onClearCustomer,
  notePresets, noteTab, onNoteTabChange, selectedPresetIds, onTogglePreset, customNote, onCustomNoteChange,
}: Props) {
  const t = useTranslations('pos')
  const tNotes = useTranslations('notePresets')
  const currency = useCurrencyDisplay()
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [openSection, setOpenSection] = useState<'coupon' | 'notes' | null>(null)
  const toggleSection = (key: 'coupon' | 'notes') =>
    setOpenSection((prev) => (prev === key ? null : key))

  // يتحقق فعليًا من الكود عبر /coupons/validate قبل قبوله — لا يُعرَض كمطبَّق أبدًا
  // إلا بعد تأكيد صحته ومبلغ خصمه الحقيقي من السيرفر.
  const handleApplyCoupon = async () => {
    const coupon = couponInput.trim()
    if (!coupon || cart.rawSubtotal <= 0) return
    setValidatingCoupon(true)
    setCouponError(null)
    try {
      // Must use rawSubtotal, not subtotal — the backend independently
      // re-validates/re-computes the coupon's discount at checkout against
      // this exact same raw (pre-discount, pre-tax-extraction) figure
      // (InvoicesService.create(), manualBuilt.subtotal). Using `subtotal`
      // here would match under exclusive mode (where they're equal) but
      // silently diverge under inclusive mode, showing a preview discount
      // that disagrees with what checkout actually applies.
      const result = await couponsApi.validate(coupon, cart.rawSubtotal)
      onApplyCoupon(result.code, result.discount_amount)
      setCouponInput('')
    } catch (e: unknown) {
      setCouponError(e instanceof ApiError ? e.message : t('couponInvalid'))
    } finally {
      setValidatingCoupon(false)
    }
  }

  const totalUnits = cart.items.reduce((sum, i) => sum + i.quantity, 0)
  const [totalOpen, setTotalOpen] = useState(false)

  // Coupon / loyalty / rewards / notes: compact buttons; the chosen one opens
  // its body right below (same bodies and behaviour as before).
  type SectionKey = 'coupon' | 'notes'
  const sectionButtons: {
    key: SectionKey
    icon: React.ElementType
    label: string // short name (icon-only buttons on phones use it as tooltip)
    applied: boolean
    desc: string // one-line explanation on the wide card
    desc2?: string
    action: string // the card's button
  }[] = [
    {
      key: 'coupon',
      icon: Tag,
      label: cart.coupon_code ? cart.coupon_code : t('couponShort'),
      applied: !!cart.coupon_code,
      desc: cart.coupon_code
        ? `${cart.coupon_code}${cart.coupon_discount_amount > 0 ? ` · −${fmt(cart.coupon_discount_amount)} ${currency}` : ''}`
        : t('couponDesc'),
      action: t('couponAction'),
    },
    {
      key: 'notes',
      icon: PenLine,
      label: t('notesShort'),
      applied: noteTab === 'custom' ? !!customNote.trim() : selectedPresetIds.length > 0,
      desc: tNotes('notesLabel'),
      action: t('notesAction'),
    },
  ]

  const mutedText = 'text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary'
  const bodyBox = 'mt-2 rounded-xl bg-posCloud-background p-3 dark:bg-posCloudDark-background'

  return (
    // Full-height panel on desktop: the order scrolls in the middle while the
    // totals and the Checkout button stay pinned to the bottom of the panel.
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Header: cart icon with the units badge, title, counts, clear all */}
        <div className="mb-3 flex items-center gap-3 pt-2">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-posCloud-primary-light text-posCloud-primary dark:bg-posCloud-primary/15">
            <ShoppingCart className="h-5 w-5" />
            {totalUnits > 0 && (
              <span className="absolute -top-1.5 -end-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-posCloud-primary px-1 text-[11px] font-bold text-white">
                {totalUnits}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('currentOrder')}</h2>
            {cart.items.length > 0 && (
              <p className={`truncate text-xs ${mutedText}`}>
                {t('cartLines', { count: cart.items.length })} · {t('cartUnits', { count: totalUnits })}
              </p>
            )}
          </div>
          {cart.items.length > 0 && (
            <button onClick={onClear} className="shrink-0 text-xs text-posCloud-danger hover:brightness-90">
              {t('clearAll')}
            </button>
          )}
        </div>

        {cart.items.length === 0 ? (
          <div className={`flex flex-col items-center py-4 ${mutedText}`}>
            <span className="mb-1 text-2xl">🛒</span>
            <p className="text-sm">{t('noItems')}</p>
          </div>
        ) : (
          <div className="mb-3 space-y-2">
            {cart.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-posCloud-border bg-posCloud-surface p-2.5 dark:border-posCloudDark-border dark:bg-posCloudDark-surface">
                <div className="flex items-start gap-2.5">
                  <div className="hidden min-[480px]:block">
                    <CartLineImage cartItem={item} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 break-words text-[13px] font-semibold leading-snug text-posCloud-text-primary dark:text-posCloudDark-text-primary">{item.name}</p>
                    {item.variant_name && <p className={`truncate text-xs ${mutedText}`}>{item.variant_name}</p>}
                    {item.category_name && (
                      <span className="mt-1 inline-block max-w-full truncate rounded-full bg-posCloud-primary-light px-2 py-0.5 text-[10px] font-medium text-posCloud-primary dark:bg-posCloud-primary/15">
                        {item.category_name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    aria-label={t('removeLine')}
                    title={t('removeLine')}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-posCloud-danger/10 text-posCloud-danger transition-colors hover:bg-posCloud-danger/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                  <div className="flex shrink-0 items-center rounded-full border border-posCloud-border bg-posCloud-background dark:border-posCloudDark-border dark:bg-posCloudDark-background">
                    <button
                      onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                      aria-label="−"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-posCloud-primary hover:bg-posCloud-primary-light"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <QtyInput value={item.quantity} onChange={(n) => onUpdateQty(item.id, n)} invalidMsg={t('qtyInvalid')} maxMsg={t('qtyMax', { max: MAX_LINE_QTY })} />
                    <button
                      onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                      aria-label="+"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-posCloud-primary hover:bg-posCloud-primary-light"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="min-w-0 text-end max-[479px]:w-full max-[479px]:text-start">
                    <p className="truncate text-sm font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{fmt(item.total_price)} {currency}</p>
                    <p className={`text-[11px] ${mutedText}`} dir="ltr">{fmt(item.unit_price)} × {item.quantity}</p>
                  </div>
                </div>

                {workers.length > 0 && onSetWorker && (
                  <select
                    value={item.worker_id ?? ''}
                    onChange={(e) => onSetWorker(item.id, e.target.value || undefined)}
                    aria-label={t('worker.label')}
                    className="mt-2 w-full rounded-lg border border-posCloud-border bg-white px-2 py-1 text-xs text-posCloud-text-secondary dark:border-posCloudDark-border dark:bg-posCloudDark-surface dark:text-posCloudDark-text-secondary"
                  >
                    <option value="">{t('worker.none')}</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        {customerCaptureEnabled && selectedCustomer && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-posCloud-background p-2.5 dark:bg-posCloudDark-background">
            <div className="flex min-w-0 items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-posCloud-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-posCloud-text-primary dark:text-posCloudDark-text-primary">{selectedCustomer.full_name || '—'}</p>
                {selectedCustomer.phone && <p className={`text-xs ${mutedText}`} dir="ltr">{selectedCustomer.phone}</p>}
              </div>
            </div>
            <button onClick={onClearCustomer} aria-label={t('clearCustomer')} className={`shrink-0 hover:text-posCloud-danger ${mutedText}`}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>

      <div className="shrink-0 pt-3">
      {/* الكود يُتحقَّق منه فعليًا عبر /coupons/validate وقت التطبيق —
          القيم الحقيقية (نسبة/مبلغ الخصم) تُجلَب من السيرفر، لا تُحدَّد يدويًا هنا أبدًا. */}
      {/* Wide (>= 480px): three cards - icon, title, short text and an action
          button each. Narrow: icon-only buttons in one row. Both open the same
          body below. */}
      <div className="hidden grid-flow-col auto-cols-fr items-stretch gap-1.5 min-[820px]:grid">
        {sectionButtons.map(({ key, icon: Icon, applied, label, desc, desc2, action }) => (
          <div
            key={key}
            className={`flex min-w-0 flex-col gap-1.5 rounded-xl border p-1.5 ${
              applied
                ? 'border-posCloud-success/40 bg-posCloud-success-light'
                : 'border-posCloud-border bg-posCloud-surface dark:border-posCloudDark-border dark:bg-posCloudDark-surface'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-posCloud-primary-light text-posCloud-primary dark:bg-posCloud-primary/15">
                <Icon className="h-3 w-3" />
              </span>
              <span className="min-w-0 truncate text-[11px] font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{label}</span>
            </div>
            <p className={`line-clamp-3 min-h-[2.25rem] text-[10px] leading-snug ${mutedText}`}>
              {desc}
              {desc2 && <><br />{desc2}</>}
            </p>
            <button
              type="button"
              onClick={() => toggleSection(key)}
              className={`mt-auto flex w-full items-center justify-center gap-0.5 rounded-lg border px-0.5 py-1.5 text-[10px] font-semibold transition-colors ${
                openSection === key
                  ? 'border-posCloud-primary bg-posCloud-primary-light text-posCloud-primary dark:bg-posCloud-primary/15'
                  : 'border-posCloud-primary/40 text-posCloud-primary hover:bg-posCloud-primary-light dark:hover:bg-posCloud-primary/15'
              }`}
            >
              <span className="truncate">{action}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(38px,1fr))] gap-2 min-[820px]:hidden">
        {sectionButtons.map(({ key, icon: Icon, label, applied }) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => toggleSection(key)}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-center text-[11px] font-medium transition-colors ${
              applied
                ? 'border-posCloud-success/40 bg-posCloud-success-light text-posCloud-success'
                : openSection === key
                  ? 'border-posCloud-primary/50 bg-posCloud-primary-light text-posCloud-primary dark:bg-posCloud-primary/15'
                  : 'border-posCloud-border bg-posCloud-surface text-posCloud-text-secondary hover:bg-slate-50 dark:border-posCloudDark-border dark:bg-posCloudDark-surface dark:text-posCloudDark-text-secondary dark:hover:bg-white/5'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {openSection === 'coupon' && (
        <div className={bodyBox}>
          {cart.coupon_code ? (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-posCloud-success">
                {cart.coupon_discount_amount > 0 ? `−${fmt(cart.coupon_discount_amount)} ${currency}` : cart.coupon_code}
              </span>
              <button onClick={onClearCoupon} className="text-posCloud-danger hover:brightness-90">
                {t('removeCoupon')}
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  placeholder={t('couponCode')}
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && couponInput.trim() && !validatingCoupon) handleApplyCoupon() }}
                  className="flex-1 min-w-0 rounded-full border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3.5 py-2 text-xs uppercase text-posCloud-text-primary dark:text-posCloudDark-text-primary outline-none placeholder:normal-case placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"
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
        </div>
      )}

      {openSection === 'notes' && (
        <div className={bodyBox}>
          <div className="space-y-2">
            <div className="flex gap-1 rounded-lg bg-posCloud-surface p-1 dark:bg-posCloudDark-surface">
              <button
                onClick={() => onNoteTabChange('list')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${noteTab === 'list' ? 'bg-posCloud-background text-posCloud-primary shadow-sm dark:bg-posCloudDark-background' : 'text-posCloud-text-tertiary'}`}
              >
                <List className="h-3.5 w-3.5" />
                {tNotes('chooseFromList')}
              </button>
              <button
                onClick={() => onNoteTabChange('custom')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${noteTab === 'custom' ? 'bg-posCloud-background text-posCloud-primary shadow-sm dark:bg-posCloudDark-background' : 'text-posCloud-text-tertiary'}`}
              >
                <PenLine className="h-3.5 w-3.5" />
                {tNotes('writeNote')}
              </button>
            </div>

            {noteTab === 'list' ? (
              notePresets.length === 0 ? (
                <p className={`text-xs ${mutedText}`}>{tNotes('noPresets')}</p>
              ) : (
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {notePresets.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-xs text-posCloud-text-secondary hover:bg-posCloud-surface dark:text-posCloudDark-text-secondary dark:hover:bg-posCloudDark-surface">
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
                className="w-full resize-none rounded-lg border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-surface dark:bg-posCloudDark-surface px-3 py-2 text-xs text-posCloud-text-primary dark:text-posCloudDark-text-primary outline-none placeholder:text-posCloud-text-tertiary dark:placeholder:text-posCloudDark-text-tertiary"
              />
            )}
          </div>
        </div>
      )}

        {/* Final total: collapsible; the VAT line stays visible either way. */}
        <div className="mt-2 rounded-xl border border-posCloud-border bg-posCloud-background p-2.5 dark:border-posCloudDark-border dark:bg-posCloudDark-background">
          <button
            type="button"
            onClick={() => setTotalOpen((v) => !v)}
            aria-expanded={totalOpen}
            aria-label={t('totalFinal')}
            className="flex w-full items-center gap-2 text-start"
          >
            <Wallet className="h-4 w-4 shrink-0 text-posCloud-primary" />
            <span className="hidden min-w-0 flex-1 truncate text-[13px] min-[480px]:block font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">
              {t('totalFinal')}
            </span>
            <span className="shrink-0 text-lg font-extrabold leading-none text-posCloud-primary">
              {fmt(cart.total)} <span className="text-xs font-bold">{currency}</span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 ${mutedText} transition-transform ${totalOpen ? 'rotate-180' : ''}`} />
          </button>
          {/* The VAT amount stays visible while the rest is folded. */}
          <div className={`mt-1.5 flex items-center justify-between gap-2 text-[11px] ${mutedText}`}>
            <span className="truncate">{t('tax')}</span>
            <span className="shrink-0">{fmt(cart.tax_amount)} {currency}</span>
          </div>
          {totalOpen && (
            <div className={`mt-2 space-y-1.5 border-t border-posCloud-border pt-2 text-xs dark:border-posCloudDark-border ${mutedText}`}>
              <div className="flex justify-between gap-2">
                <span>{t('subtotal')}</span>
                <span className="shrink-0">{fmt(cart.subtotal)} {currency}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>{t('tax')}</span>
                <span>{cart.tax_inclusive ? t('taxMode.inclusive') : t('taxMode.exclusive')}</span>
              </div>
              {cart.coupon_discount_amount > 0 && (
                <div className="flex justify-between text-posCloud-success">
                  <span>{t('discount')}</span>
                  <span>−{fmt(cart.coupon_discount_amount)} {currency}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          {onHold && (
            <button
              onClick={onHold}
              aria-label={t('heldOrders.holdButton')}
              title={t('heldOrders.holdButton')}
              disabled={cart.items.length === 0 || isHolding}
              className="flex shrink-0 min-[480px]:min-w-[88px] min-[480px]:flex-1 items-center justify-center gap-1.5 rounded-xl border border-posCloud-primary/40 px-2 py-3 text-xs font-semibold text-posCloud-text-secondary transition-colors hover:bg-slate-50 disabled:opacity-50 dark:text-posCloudDark-text-secondary dark:hover:bg-white/5"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden min-[480px]:inline">{t('heldOrders.holdButton')}</span>
            </button>
          )}
          <Button
            size="lg"
            disabled={cart.items.length === 0 || cart.rawSubtotal <= 0}
            title={cart.items.length > 0 && cart.rawSubtotal <= 0 ? t('zeroTotal') : undefined}
            onClick={onCheckout}
            className="min-w-0 flex-[2] gap-2"
          >
            {t('checkout')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  )
}
