'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ItemGrid } from '../components/ItemGrid'
import { CartPanel } from '../components/CartPanel'
import { PaymentModal } from '../components/PaymentModal'
import { ReceiptModal } from '../components/ReceiptModal'
import { CustomerPickerModal } from '../components/CustomerPickerModal'
import { useCart } from '../hooks/useCart'
import { PaymentData } from '../types/pos.types'
import { createOrder } from '@/features/orders/api/orders.api'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { apiClient } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { ShoppingCart, Grid } from 'lucide-react'
import type { Customer } from '@/features/customers/types/customer.types'

export function POSPage() {
  const { user } = useAuthStore()
  const t = useTranslations('pos')
  const [showPayment, setShowPayment] = useState(false)
  const [receipt, setReceipt] = useState<{ payment: PaymentData; invoiceNumber: string; taxRate: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mobileTab, setMobileTab] = useState<'items' | 'cart'>('items')
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.get('/branches') as any,
    enabled: !!user,
  })

  const { data: currentShift } = useQuery({
    queryKey: ['shifts', 'current'],
    queryFn: () => apiClient.get('/shifts/current') as any,
    enabled: !!user,
  })

  const { data: tenantProfile } = useQuery({
    queryKey: ['tenant', 'profile'],
    queryFn: () => apiClient.get<{ tax_rate?: number; customer_capture_enabled?: boolean }>('/tenant/profile'),
    enabled: !!user,
  })

  const taxRate = (tenantProfile as any)?.tax_rate ?? 0.15
  const customerCaptureEnabled = (tenantProfile as any)?.customer_capture_enabled ?? false

  const { cart, addItem, removeItem, updateQty, applyDiscount, clearCart } = useCart(taxRate)

  const branchId = user?.branchId ?? (branches as any)?.[0]?.id ?? ''

  const handleConfirmPayment = async (data: PaymentData) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const order = await createOrder({
        branch_id: branchId,
        shift_id: currentShift?.id,
        customer_id: selectedCustomer?.id,
        payment_method: data.method,
        cash_tendered: data.method === 'cash' ? data.cash_tendered : undefined,
        cash_amount: data.method === 'split' ? data.split_cash : undefined,
        card_amount: data.method === 'split' ? data.split_card : undefined,
        items: cart.items.map(item => ({
          item_id: item.item_id,
          item_name: item.name,
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        discount: cart.discount_type
          ? {
              type: cart.discount_type,
              value: cart.discount_value,
            }
          : undefined,
      })
      setShowPayment(false)
      setReceipt({
        payment: data,
        invoiceNumber: order.id.slice(-6).toUpperCase(),
        taxRate: (order as any).tax_rate ?? taxRate,
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
    setSelectedCustomer(null)
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">

      {/* Mobile Tabs */}
      <div className="flex lg:hidden border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={() => setMobileTab('items')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            mobileTab === 'items'
              ? 'text-[#0C447C] border-b-2 border-[#0C447C]'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Grid className="w-4 h-4" />
          {t('items')}
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            mobileTab === 'cart'
              ? 'text-[#0C447C] border-b-2 border-[#0C447C]'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {t('currentOrder')}
          {cart.items.length > 0 && (
            <span className="bg-[#0C447C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.items.length}
            </span>
          )}
        </button>
      </div>

      {/* Desktop: side by side — Mobile: tabs */}
      <div className="flex flex-1 min-h-0 gap-4 p-4 overflow-hidden">

        {/* Items Grid */}
        <div className={`flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col ${mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
          <ItemGrid onAddItem={(item, variant) => {
            addItem(item, variant)
          }} />
        </div>

        {/* Cart Panel */}
        <div className={`lg:w-80 lg:shrink-0 w-full min-h-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col overflow-hidden ${mobileTab === 'items' ? 'hidden lg:flex' : 'flex'}`}>
          <CartPanel
            cart={cart}
            onUpdateQty={updateQty}
            onRemoveItem={removeItem}
            onApplyDiscount={applyDiscount}
            onCheckout={() => setShowPayment(true)}
            onClear={clearCart}
            customerCaptureEnabled={customerCaptureEnabled}
            selectedCustomer={selectedCustomer}
            onOpenCustomerPicker={() => setShowCustomerPicker(true)}
            onClearCustomer={() => setSelectedCustomer(null)}
          />
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          cart={cart}
          onConfirm={handleConfirmPayment}
          onClose={() => setShowPayment(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {showCustomerPicker && (
        <CustomerPickerModal
          onSelect={(customer) => {
            setSelectedCustomer(customer)
            setShowCustomerPicker(false)
          }}
          onClose={() => setShowCustomerPicker(false)}
        />
      )}

      {receipt && (
        <ReceiptModal
          cart={cart}
          payment={receipt.payment}
          invoiceNumber={receipt.invoiceNumber}
          taxRate={receipt.taxRate}
          onClose={() => setReceipt(null)}
          onNewOrder={handleNewOrder}
        />
      )}
    </div>
  )
}