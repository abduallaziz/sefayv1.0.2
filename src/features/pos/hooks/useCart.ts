import { useState, useCallback } from 'react'
import { Cart, CartItem, POSItem, POSVariant } from '../types/pos.types'

function calcCart(items: CartItem[], taxRate: number): Cart {
  const subtotal = items.reduce((sum, i) => sum + i.total_price, 0)
  const tax_amount = Math.round(subtotal * taxRate * 100) / 100
  const total = Math.round((subtotal + tax_amount) * 100) / 100

  return {
    items,
    subtotal,
    tax_amount,
    tax_rate: taxRate,
    total,
  }
}

export function useCart(taxRate: number = 0) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [couponCode, setCouponCode] = useState<string | undefined>()

  const cart = calcCart(cartItems, taxRate)

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
  }, [])

  const removeItem = useCallback((cartId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.id !== cartId))
  }, [])

  const updateQty = useCallback((cartId: string, qty: number) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((ci) => ci.id !== cartId))
      return
    }
    setCartItems((prev) =>
      prev.map((ci) =>
        ci.id === cartId ? { ...ci, quantity: qty, total_price: qty * ci.unit_price } : ci
      )
    )
  }, [])

  // A coupon's discount is looked up and applied server-side from the coupon's own
  // definition — never entered manually here.
  const applyCoupon = useCallback((coupon: string) => {
    setCouponCode(coupon)
  }, [])

  const clearCoupon = useCallback(() => {
    setCouponCode(undefined)
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
    setCouponCode(undefined)
  }, [])

  return {
    cart: { ...cart, coupon_code: couponCode },
    addItem,
    removeItem,
    updateQty,
    applyCoupon,
    clearCoupon,
    clearCart,
  }
}
