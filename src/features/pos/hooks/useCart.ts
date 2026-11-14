import { useState, useCallback } from 'react'
import { Cart, CartItem, POSItem, POSVariant } from '../types/pos.types'

// Tax Pricing Phase 1 (Owner-approved) — must mirror pos.engine.ts's
// applyTax/calculateTotal exactly, including the inclusive-mode subtraction
// identity (tax = gross - base, never an independently-rounded
// gross*rate/(1+rate)), so the preview can never disagree with what the
// backend actually charges and records. See api/src/engines/pos-engine/pos.engine.ts.
export function calcCart(
  items: CartItem[],
  taxRate: number,
  couponDiscountAmount: number,
  taxInclusive: boolean,
): Cart {
  // Matches pos.engine.ts calculateSubtotal's rounding exactly, for the
  // same reason as tax_amount/total below.
  const rawSubtotal = parseFloat(items.reduce((sum, i) => sum + i.total_price, 0).toFixed(2))
  const discount = Math.min(couponDiscountAmount, rawSubtotal)
  const afterDiscount = rawSubtotal - discount

  let tax_amount: number
  let total: number
  if (taxInclusive) {
    const base = parseFloat((afterDiscount / (1 + taxRate)).toFixed(2))
    tax_amount = parseFloat((afterDiscount - base).toFixed(2))
    total = parseFloat(afterDiscount.toFixed(2))
  } else {
    // Must match the backend's exact rounding method (pos.engine.ts
    // applyTax/calculateTotal, both `parseFloat(x.toFixed(2))`) — not just
    // "round to 2 decimals" in the abstract. toFixed(2) and Math.round(x*100)/100
    // are NOT interchangeable: for some real inputs they round the same
    // logical value differently (confirmed live: 10.5 subtotal at 15% tax
    // gave tax=1.58/total=12.08 via Math.round but the authoritative
    // server-recorded order was tax=1.57/total=12.07 via toFixed). The preview
    // must reproduce the server's actual method, or it can show the cashier
    // a number that doesn't match what's actually charged.
    tax_amount = parseFloat((afterDiscount * taxRate).toFixed(2))
    total = parseFloat((afterDiscount + tax_amount).toFixed(2))
  }

  // Stored/displayed subtotal always means the PRE-discount net figure, in
  // both modes — required so subtotal - discount + tax = total holds
  // universally (the accounting-posting engine enforces this
  // unconditionally; see pos.engine.ts buildInvoice for the full
  // reasoning). Since total already has the discount baked in, solving
  // that identity gives subtotal = rawSubtotal - tax, which reconciles by
  // construction and collapses to rawSubtotal when there's no discount.
  const subtotal = taxInclusive
    ? parseFloat((rawSubtotal - tax_amount).toFixed(2))
    : rawSubtotal

  return {
    items,
    subtotal,
    rawSubtotal,
    coupon_discount_amount: discount,
    tax_amount,
    tax_rate: taxRate,
    tax_inclusive: taxInclusive,
    total,
  }
}

// A single line can hold at most this many units (a typing slip like 99999999 must not reach checkout).
export const MAX_LINE_QTY = 9999

export function useCart(taxRate: number = 0, taxInclusive: boolean = false) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [couponCode, setCouponCode] = useState<string | undefined>()
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0)

  const cart = calcCart(cartItems, taxRate, couponDiscountAmount, taxInclusive)

  // A coupon's discount_amount is fetched once (via /coupons/validate) against the
  // subtotal at the moment it's applied. Adding/removing/changing quantity afterward
  // would make that cached amount stale (a percentage coupon's real discount changes
  // with the subtotal), so any cart mutation clears the coupon — the cashier re-applies
  // it, which re-validates against the new subtotal. Simpler and safer than trying to
  // silently recompute a percentage-vs-fixed discount client-side.
  const clearCouponIfAny = useCallback(() => {
    setCouponCode((prev) => (prev ? undefined : prev))
    setCouponDiscountAmount((prev) => (prev !== 0 ? 0 : prev))
  }, [])

  const addItem = useCallback((item: POSItem, variant?: POSVariant) => {
    const cartId = variant ? `${item.id}_${variant.id}` : item.id
    const unitPrice = item.price + (variant?.price_adjustment ?? 0)

    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.id === cartId)
      if (existing) {
        return prev.map((ci) =>
          ci.id === cartId
            ? (() => {
                const q = Math.min(ci.quantity + 1, MAX_LINE_QTY)
                return { ...ci, quantity: q, total_price: parseFloat((q * ci.unit_price).toFixed(2)) }
              })()
            : ci
        )
      }
      return [
        ...prev,
        {
          id: cartId,
          item_id: item.id,
          name: item.name,
          variant_id: variant?.id,
          variant_name: variant?.name,
          image_url: item.image_url,
          category_name: item.category_name,
          quantity: 1,
          unit_price: unitPrice,
          total_price: unitPrice,
        },
      ]
    })
    clearCouponIfAny()
  }, [clearCouponIfAny])

  const removeItem = useCallback((cartId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.id !== cartId))
    clearCouponIfAny()
  }, [clearCouponIfAny])

  const updateQty = useCallback((cartId: string, qty: number) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((ci) => ci.id !== cartId))
      clearCouponIfAny()
      return
    }
    setCartItems((prev) =>
      prev.map((ci) =>
        ci.id === cartId
          ? { ...ci, quantity: Math.min(qty, MAX_LINE_QTY), total_price: parseFloat((Math.min(qty, MAX_LINE_QTY) * ci.unit_price).toFixed(2)) }
          : ci
      )
    )
    clearCouponIfAny()
  }, [clearCouponIfAny])

  // G4 - assign (or clear) the worker of one cart line. Does not touch prices,
  // so the coupon stays valid.
  const setWorker = useCallback((cartId: string, workerId?: string) => {
    setCartItems((prev) => prev.map((ci) => (ci.id === cartId ? { ...ci, worker_id: workerId } : ci)))
  }, [])

  // Called only after /coupons/validate has already confirmed the code and returned
  // its real discount_amount — never entered/computed manually here.
  const applyCoupon = useCallback((coupon: string, discountAmount: number) => {
    setCouponCode(coupon)
    setCouponDiscountAmount(discountAmount)
  }, [])

  const clearCoupon = useCallback(() => {
    setCouponCode(undefined)
    setCouponDiscountAmount(0)
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
    setCouponCode(undefined)
    setCouponDiscountAmount(0)
  }, [])

  // Bulk-replaces the cart with exact items/quantities — used when resuming
  // a held order, where the real quantities are already known server-side
  // and looping addItem() (which only ever increments by 1) would be both
  // slower and semantically wrong for a direct restore.
  const loadItems = useCallback((items: CartItem[]) => {
    setCartItems(items)
    clearCouponIfAny()
  }, [clearCouponIfAny])

  return {
    cart: { ...cart, coupon_code: couponCode },
    addItem,
    removeItem,
    updateQty,
    setWorker,
    applyCoupon,
    clearCoupon,
    clearCart,
    loadItems,
  }
}
