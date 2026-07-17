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
import { giftCardsApi } from '@/features/gift-cards/api/gift-cards.api'
import { useActiveNotePresets } from '@/features/note-presets/hooks/useNotePresets'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { apiClient } from '@/lib/api'
import { useTranslations } from 'next-intl'
import type { Customer } from '@/features/customers/types/customer.types'

export function POSPage() {
  const { user } = useAuthStore()
  const t = useTranslations('pos')
  const [showPayment, setShowPayment] = useState(false)
  const [receipt, setReceipt] = useState<{ payment: PaymentData; invoiceNumber: string; taxRate: number; total: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Gift-card and loyalty-points state lives here (not in CartPanel or PaymentModal)
  // so the same real, server-validated selection is shared by both the cart panel's
  // preview row and the payment modal's confirm step — never two independent copies.
  const [redeemPoints, setRedeemPoints] = useState('')
  const [giftCardCode, setGiftCardCode] = useState('')
  const [giftCardApplied, setGiftCardApplied] = useState(false)
  const [giftCardAmount, setGiftCardAmount] = useState('')
  const [giftCardError, setGiftCardError] = useState<string | null>(null)
  const [validatingGiftCard, setValidatingGiftCard] = useState(false)

  // Order notes: either preset selections or one free-text note, joined into the
  // single real `Order.notes` string at checkout — the contract itself never changes.
  const [noteTab, setNoteTab] = useState<'list' | 'custom'>('list')
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([])
  const [customNote, setCustomNote] = useState('')
  const { data: notePresets = [] } = useActiveNotePresets()

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

  const { data: posConfig } = useQuery({
    queryKey: ['tenant', 'pos-config'],
    queryFn: () => apiClient.get<{ tax_rate?: number; customer_capture_enabled?: boolean; loyalty_enabled?: boolean }>('/tenant/pos-config'),
    enabled: !!user,
  })

  const taxRate = posConfig?.tax_rate ?? 0.15
  const customerCaptureEnabled = posConfig?.customer_capture_enabled ?? false
  const loyaltyEnabled = posConfig?.loyalty_enabled ?? true

  const { cart, addItem, removeItem, updateQty, applyCoupon, clearCoupon, clearCart } = useCart(taxRate)

  const branchId = user?.branchId ?? (branches as any)?.[0]?.id ?? ''

  const availablePoints = loyaltyEnabled ? (selectedCustomer?.loyalty_points ?? 0) : 0

  // يتحقق فعليًا من الكود والمبلغ عبر /gift-cards/validate قبل قبول البطاقة —
  // لا تُعرَض كمطبَّقة أبدًا إلا بعد تأكيد رصيدها الحقيقي من السيرفر.
  const handleApplyGiftCard = async () => {
    const code = giftCardCode.trim()
    if (!code || cart.total <= 0) return
    setValidatingGiftCard(true)
    setGiftCardError(null)
    try {
      await giftCardsApi.validate(code, cart.total)
      setGiftCardApplied(true)
      setGiftCardAmount(cart.total.toFixed(2))
    } catch (error: any) {
      setGiftCardError(error?.message ?? t('payment.giftCardInvalid'))
    } finally {
      setValidatingGiftCard(false)
    }
  }

  const handleRemoveGiftCard = () => {
    setGiftCardApplied(false)
    setGiftCardCode('')
  }

  const resetGiftCardAndLoyalty = () => {
    setGiftCardApplied(false)
    setGiftCardCode('')
    setGiftCardAmount('')
    setGiftCardError(null)
    setRedeemPoints('')
  }

  const togglePreset = (id: string) => {
    setSelectedPresetIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const resetNotes = () => {
    setNoteTab('list')
    setSelectedPresetIds([])
    setCustomNote('')
  }

  const finalNotes = noteTab === 'custom'
    ? customNote.trim()
    : notePresets.filter((p) => selectedPresetIds.includes(p.id)).map((p) => p.text).join('، ')

  const handleConfirmPayment = async (data: PaymentData) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setPaymentError(null)
    try {
      const order = await createOrder({
        branch_id: branchId,
        shift_id: currentShift?.id,
        customer_id: selectedCustomer?.id,
        payment_method: data.method,
        cash_tendered: data.method === 'cash' ? data.cash_tendered : undefined,
        cash_amount: data.method === 'split' ? data.split_cash : undefined,
        card_amount: data.method === 'split' ? data.split_card : undefined,
        redeem_points: data.redeem_points,
        coupon_code: cart.coupon_code,
        gift_card_code: data.gift_card_code,
        gift_card_amount: data.gift_card_amount,
        notes: finalNotes || undefined,
        items: cart.items.map(item => ({
          item_id: item.item_id,
          item_name: item.name,
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      })
      setShowPayment(false)
      setReceipt({
        payment: data,
        invoiceNumber: order.id.slice(-6).toUpperCase(),
        taxRate: (order as any).tax_rate ?? taxRate,
        // الإجمالي الحقيقي المُحصَّل فعليًا من السيرفر — وليس تقدير الواجهة (cart.total) —
        // يُعرَض بالإيصال، احتياطًا لأي فارق نادر بين لحظة معاينة الكوبون/الحساب وقت
        // الدفع الفعلي (مثلًا كوبون استُنفد بواسطة كاشير آخر بين المعاينة والتأكيد).
        total: order.total,
      })
    } catch (error: any) {
      // كان يُسجَّل بـconsole فقط بلا أي إشعار للكاشير — يظهر كأن الزر "لا يعمل" بصمت
      // عند فشل حقيقي (كوبون غير صالح لحظة التأكيد، رصيد بطاقة هدايا غير كافٍ، إلخ).
      setPaymentError(error?.message ?? t('payment.failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const openPayment = () => {
    if (!giftCardAmount) setGiftCardAmount(cart.total.toFixed(2))
    setShowPayment(true)
  }

  const handleCheckoutClick = () => {
    if (customerCaptureEnabled && !selectedCustomer) {
      setShowCustomerPicker(true)
    } else {
      openPayment()
    }
  }

  const handleNewOrder = () => {
    clearCart()
    setReceipt(null)
    setSelectedCustomer(null)
    resetGiftCardAndLoyalty()
    resetNotes()
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">

      {/* Desktop: side by side — Mobile: stacked */}
      <div className="flex flex-1 min-h-0 flex-col gap-5 overflow-auto p-4 sm:p-6 lg:flex-row lg:overflow-hidden">

        {/* Items Grid */}
        <div className="flex h-[65vh] min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:h-auto">
          <ItemGrid onAddItem={(item, variant) => {
            addItem(item, variant)
          }} />
        </div>

        {/* Cart Panel */}
        <div className="flex h-[60vh] min-h-0 w-full flex-col overflow-y-auto overflow-x-hidden rounded-2xl border border-posCloud-border bg-posCloud-surface p-5 dark:border-posCloudDark-border dark:bg-posCloudDark-surface lg:h-auto lg:overflow-hidden lg:w-[340px] lg:shrink-0">
          <CartPanel
            cart={cart}
            onUpdateQty={updateQty}
            onRemoveItem={removeItem}
            onApplyCoupon={applyCoupon}
            onClearCoupon={clearCoupon}
            onCheckout={handleCheckoutClick}
            onClear={() => { clearCart(); resetGiftCardAndLoyalty(); resetNotes() }}
            customerCaptureEnabled={customerCaptureEnabled}
            selectedCustomer={selectedCustomer}
            onClearCustomer={() => setSelectedCustomer(null)}
            loyaltyEnabled={loyaltyEnabled}
            availablePoints={availablePoints}
            redeemPoints={redeemPoints}
            onRedeemPointsChange={setRedeemPoints}
            giftCardCode={giftCardCode}
            giftCardApplied={giftCardApplied}
            giftCardError={giftCardError}
            validatingGiftCard={validatingGiftCard}
            onGiftCardCodeChange={(v) => { setGiftCardCode(v); setGiftCardError(null) }}
            onApplyGiftCard={handleApplyGiftCard}
            onRemoveGiftCard={handleRemoveGiftCard}
            notePresets={notePresets}
            noteTab={noteTab}
            onNoteTabChange={setNoteTab}
            selectedPresetIds={selectedPresetIds}
            onTogglePreset={togglePreset}
            customNote={customNote}
            onCustomNoteChange={setCustomNote}
          />
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          cart={cart}
          customer={selectedCustomer}
          loyaltyEnabled={loyaltyEnabled}
          onConfirm={handleConfirmPayment}
          onClose={() => { setShowPayment(false); setPaymentError(null) }}
          isSubmitting={isSubmitting}
          error={paymentError}
          availablePoints={availablePoints}
          redeemPoints={redeemPoints}
          onRedeemPointsChange={setRedeemPoints}
          giftCardCode={giftCardCode}
          giftCardApplied={giftCardApplied}
          giftCardAmount={giftCardAmount}
          giftCardError={giftCardError}
          validatingGiftCard={validatingGiftCard}
          onGiftCardCodeChange={(v) => { setGiftCardCode(v); setGiftCardError(null) }}
          onGiftCardAmountChange={setGiftCardAmount}
          onApplyGiftCard={handleApplyGiftCard}
          onRemoveGiftCard={handleRemoveGiftCard}
        />
      )}

      {showCustomerPicker && (
        <CustomerPickerModal
          onSelect={(customer) => {
            setSelectedCustomer(customer)
            setShowCustomerPicker(false)
            openPayment()
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
          total={receipt.total}
          onClose={() => setReceipt(null)}
          onNewOrder={handleNewOrder}
        />
      )}
    </div>
  )
}