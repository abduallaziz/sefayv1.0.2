import { useState, useCallback } from 'react'
import { Cart, CartItem, POSItem, POSVariant } from '../types/pos.types'

function calcCart(items: CartItem[], taxRate: number, couponDiscountAmount: number): Cart {
  const subtotal = items.reduce((sum, i) => sum + i.total_price, 0)
  const discount = Math.min(couponDiscountAmount, subtotal)
  const taxable = subtotal - discount
  const tax_amount = Math.round(taxable * taxRate * 100) / 100
  const total = Math.round((taxable + tax_amount) * 100) / 100

  return {
    items,
    subtotal,
    coupon_discount_amount: discount,
    tax_amount,
    tax_rate: taxRate,
    total,
  }
}

export function useCart(taxRate: number = 0) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [couponCode, setCouponCode] = useState<string | undefined>()
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0)

  const cart = calcCart(cartItems, taxRate, couponDiscountAmount)

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
            ? { ...ci, quantity: ci.quantity + 1, total_price: (ci.quantity + 1) * ci.unit_price }
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
        ci.id === cartId ? { ...ci, quantity: qty, total_price: qty * ci.unit_price } : ci
      )
    )
    clearCouponIfAny()
  }, [clearCouponIfAny])

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
    applyCoupon,
    clearCoupon,
    clearCart,
    loadItems,
  }
}
