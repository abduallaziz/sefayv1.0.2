'use client'

import { useState } from 'react'
import { ItemGrid } from '../components/ItemGrid'
import { CartPanel } from '../components/CartPanel'
import { PaymentModal } from '../components/PaymentModal'
import { ReceiptModal } from '../components/ReceiptModal'
import { useCart } from '../hooks/useCart'
import { PaymentData } from '../types/pos.types'

export function POSPage() {
  const { cart, addItem, removeItem, updateQty, applyDiscount, clearCart } = useCart()
  const [showPayment, setShowPayment] = useState(false)
  const [receipt, setReceipt] = useState<{ payment: PaymentData; invoiceNumber: string } | null>(null)

  const handleConfirmPayment = (data: PaymentData) => {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
    setShowPayment(false)
    setReceipt({ payment: data, invoiceNumber })
  }

  const handleNewOrder = () => {
    clearCart()
    setReceipt(null)
  }

  return (
    <div className="flex h-full gap-4 p-4 overflow-hidden">
      {/* Left: Items */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        <ItemGrid onAddItem={addItem} />
      </div>

      {/* Right: Cart */}
      <div className="w-80 shrink-0 bg-card border border-border rounded-xl p-4 flex flex-col overflow-hidden">
        <CartPanel
          cart={cart}
          onUpdateQty={updateQty}
          onRemoveItem={removeItem}
          onApplyDiscount={applyDiscount}
          onCheckout={() => setShowPayment(true)}
          onClear={clearCart}
        />
      </div>

      {/* Modals */}
      {showPayment && (
        <PaymentModal
          cart={cart}
          onConfirm={handleConfirmPayment}
          onClose={() => setShowPayment(false)}
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