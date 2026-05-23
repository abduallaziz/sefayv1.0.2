import { useState, useCallback } from 'react'
import { Cart, CartItem, POSItem, POSVariant } from '../types/pos.types'

const TAX_RATE = 0.15

function calcCart(items: CartItem[], discountType: Cart['discount_type'], discountValue: number): Cart {
  const subtotal = items.reduce((sum, i) => sum + i.total_price, 0)

  let discount_amount = 0
  if (discountType === 'percentage') {
    discount_amount = Math.round(subtotal * (discountValue / 100) * 100) / 100
  } else if (discountType === 'fixed') {
    discount_amount = Math.min(discountValue, subtotal)
  }

  const taxable = subtotal - discount_amount
  const tax_amount = Math.round(taxable * TAX_RATE * 100) / 100
  const total = Math.round((taxable + tax_amount) * 100) / 100

  return {
    items,
    subtotal,
    discount_amount,
    discount_type: discountType,
    discount_value: discountValue,
    tax_amount,
    tax_rate: TAX_RATE,
    total,
  }
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [discountType, setDiscountType] = useState<Cart['discount_type']>(null)
  const [discountValue, setDiscountValue] = useState(0)
  const [couponCode, setCouponCode] = useState<string | undefined>()

  const cart = calcCart(cartItems, discountType, discountValue)

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

  const applyDiscount = useCallback(
    (type: Cart['discount_type'], value: number, coupon?: string) => {
      setDiscountType(type)
      setDiscountValue(value)
      setCouponCode(coupon)
    },
    []
  )

  const clearCart = useCallback(() => {
    setCartItems([])
    setDiscountType(null)
    setDiscountValue(0)
    setCouponCode(undefined)
  }, [])

  return { cart: { ...cart, coupon_code: couponCode }, addItem, removeItem, updateQty, applyDiscount, clearCart }
}