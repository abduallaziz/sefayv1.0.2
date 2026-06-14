'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ItemGrid } from '../components/ItemGrid'
import { CartPanel } from '../components/CartPanel'
import { PaymentModal } from '../components/PaymentModal'
import { ReceiptModal } from '../components/ReceiptModal'
import { useCart } from '../hooks/useCart'
import { PaymentData } from '../types/pos.types'
import { createOrder } from '@/features/orders/api/orders.api'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { apiClient } from '@/lib/api'

export function POSPage() {
  const { cart, addItem, removeItem, updateQty, applyDiscount, clearCart } = useCart()
  const { user } = useAuthStore()
  const [showPayment, setShowPayment] = useState(false)
  const [receipt, setReceipt] = useState<{ payment: PaymentData; invoiceNumber: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.get('/branches') as any,
    enabled: !!user,
  })

  const branchId = user?.branchId ?? (branches as any)?.[0]?.id ?? ''

  const { data: currentShift } = useQuery({
    queryKey: ['shifts', 'current'],
    queryFn: () => apiClient.get('/shifts/current') as any,
    enabled: !!user,
  })

  const handleConfirmPayment = async (data: PaymentData) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const order = await createOrder({
        branch_id: branchId,
        shift_id: currentShift?.id,
        payment_method: data.method,
        items: cart.items.map(item => ({
          item_id: item.item_id,
          item_name: item.name,
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        discount_amount: cart.discount_amount > 0 ? cart.discount_amount : undefined,
        coupon_code: cart.coupon_code,
      })

      setShowPayment(false)
      setReceipt({
        payment: data,
        invoiceNumber: order.id.slice(-6).toUpperCase(),
      })
    } catch (error) {
      console.error('Failed to create order:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewOrder = () => {
    clearCart()
    setReceipt(null)
  }

  return (
    <div className="flex h-full gap-4 p-4 overflow-hidden">
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        <ItemGrid onAddItem={addItem} />
      </div>

      <div className="w-80 shrink-0 bg-[#141720] border border-[#1e2130] rounded-xl p-4 flex flex-col overflow-hidden">
        <CartPanel
          cart={cart}
          onUpdateQty={updateQty}
          onRemoveItem={removeItem}
          onApplyDiscount={applyDiscount}
          onCheckout={() => setShowPayment(true)}
          onClear={clearCart}
        />
      </div>

      {showPayment && (
        <PaymentModal
          cart={cart}
          onConfirm={handleConfirmPayment}
          onClose={() => setShowPayment(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {receipt && (
        <ReceiptModal
          cart={cart}
          payment={receipt.payment}
          invoiceNumber={receipt.invoiceNumber}
          onClose={() => setReceipt(null)}
          onNewOrder={handleNewOrder}
        />
      )}
    </div>
  )
}