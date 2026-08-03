'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ItemGrid } from '../components/ItemGrid'
import { CartPanel } from '../components/CartPanel'
import { PaymentModal } from '../components/PaymentModal'
import { ReceiptModal } from '../components/ReceiptModal'
import { CustomerPickerModal } from '../components/CustomerPickerModal'
import { HeldOrdersModal } from '../components/HeldOrdersModal'
import { useCart } from '../hooks/useCart'
import { useHeldOrders, useHoldOrder, useCancelHeldOrder } from '../hooks/useHeldOrders'
import { PaymentData } from '../types/pos.types'
import { createOrder, fetchHeldOrder, type HeldOrder } from '@/features/orders/api/orders.api'
import { giftCardsApi } from '@/features/gift-cards/api/gift-cards.api'
import { useActiveNotePresets } from '@/features/note-presets/hooks/useNotePresets'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { apiClient } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import type { Customer } from '@/features/customers/types/customer.types'
import { OpenShiftModal } from '@/features/shifts/components/OpenShiftModal'
import { CloseShiftModal } from '@/features/shifts/components/CloseShiftModal'
import { Lock, LockOpen } from 'lucide-react'

export function POSPage() {
  const { user } = useAuthStore()
  const t = useTranslations('pos')
  const [showPayment, setShowPayment] = useState(false)
  const [receipt, setReceipt] = useState<{ payment: PaymentData; invoiceNumber: string; taxRate: number; total: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showHeldOrders, setShowHeldOrders] = useState(false)
  const [showOpenRegister, setShowOpenRegister] = useState(false)
  const [showCloseRegister, setShowCloseRegister] = useState(false)

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

  const { data: currentShift, isLoading: shiftLoading } = useQuery({
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

  const { cart, addItem, removeItem, updateQty, applyCoupon, clearCoupon, clearCart, loadItems } = useCart(taxRate)

  const branchId = user?.branchId ?? (branches as any)?.[0]?.id ?? ''

  const { data: heldOrders = [] } = useHeldOrders(branchId)
  const holdOrderMutation = useHoldOrder(branchId)
  const cancelHeldOrderMutation = useCancelHeldOrder(branchId)

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
      // البيع نجح دائمًا حتى لو فشل خصم المخزون (best-effort عمدًا — راجع
      // invoices.service.ts create()) — كان الفشل ده يتسجل في سجلات السيرفر
      // بس ومحدش يشوفه. لازم يظهر للكاشير بدل ما يفضل مدفون.
      if (order.stock_warning) {
        toast.warning(t('payment.stockWarning'))
      }
    } catch (error: any) {
      // كان يُسجَّل بـconsole فقط بلا أي إشعار للكاشير — يظهر كأن الزر "لا يعمل" بصمت
      // عند فشل حقيقي (كوبون غير صالح لحظة التأكيد، رصيد بطاقة هدايا غير كافٍ، إلخ).
      // رسالة "لا توجد جلسة صندوق نشطة" من الباك-إند نص تقني (بادئة NO_ACTIVE_CASH_SESSION)
      // لا يجب أن يظهر للكاشير كما هو — تُصنَّف هنا وتُستبدَل برسالة عمل واضحة.
      const rawMessage: string = error?.message ?? ''
      setPaymentError(
        rawMessage.includes('NO_ACTIVE_CASH_SESSION')
          ? t('payment.noActiveSession')
          : rawMessage || t('payment.failed'),
      )
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

  // Holding never touches payment/stock/coupon/loyalty — it's a plain
  // items+customer+notes snapshot on the backend (see invoices.service.ts
  // holdOrder()). Clearing the active cart afterward is what lets the
  // cashier immediately start a new sale for the next customer.
  const handleHold = () => {
    if (cart.items.length === 0) return
    holdOrderMutation.mutate(
      {
        branch_id: branchId,
        shift_id: currentShift?.id,
        customer_id: selectedCustomer?.id,
        notes: finalNotes || undefined,
        items: cart.items.map((item) => ({
          item_id: item.item_id,
          item_name: item.name,
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      },
      {
        onSuccess: () => {
          toast.success(t('heldOrders.held'))
          clearCart()
          setSelectedCustomer(null)
          resetGiftCardAndLoyalty()
          resetNotes()
        },
        onError: (error: any) => {
          toast.error(error?.message ?? t('heldOrders.holdFailed'))
        },
      },
    )
  }

  // Loads the held ticket's exact items back into the active cart, then
  // removes the hold — checkout from here on is the completely normal,
  // unmodified flow (handleConfirmPayment / createOrder below).
  //
  // The list row (GET /invoices/held) never carries `items` — only the
  // detail endpoint (GET /invoices/held/:id) does — so this re-fetches
  // the full order before loading it into the cart.
  const handleResumeHeldOrder = async (order: HeldOrder) => {
    if (cart.items.length > 0) {
      const confirmed = window.confirm(t('heldOrders.confirmReplaceCart'))
      if (!confirmed) return
    }
    let full: HeldOrder
    try {
      full = await fetchHeldOrder(order.id)
    } catch (error: any) {
      toast.error(error?.message ?? t('heldOrders.resumeFailed'))
      return
    }
    loadItems(
      (full.items ?? []).map((item) => ({
        id: item.variant_id ? `${item.item_id}_${item.variant_id}` : item.item_id,
        item_id: item.item_id,
        name: item.item_name,
        variant_id: item.variant_id,
        variant_name: item.variant_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      })),
    )
    if (full.customer_id && full.customer_name) {
      setSelectedCustomer({ id: full.customer_id, full_name: full.customer_name } as Customer)
    }
    if (full.notes) {
      setNoteTab('custom')
      setCustomNote(full.notes)
    }
    setShowHeldOrders(false)
    cancelHeldOrderMutation.mutate(full.id)
    toast.success(t('heldOrders.resumed'))
  }

  // البيع ممنوع كليًا بلا جلسة صندوق مفتوحة (نفس القاعدة المفروضة في الباك-إند
  // عبر ShiftsService.assertOpenSession) — الواجهة تعكسها بإخفاء شاشة البيع
  // بالكامل بدل الاعتماد فقط على رفض السيرفر لطلب الدفع. لا نعرض شيئًا أثناء
  // التحميل الأول لتفادي "ومضة" شاشة الإغلاق قبل وصول حالة الجلسة الحقيقية.
  if (!shiftLoading && !currentShift) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800">
          <Lock className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {t('cashRegister.closedTitle')}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('cashRegister.closedSubtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowOpenRegister(true)}
          className="mt-2 rounded-lg bg-[#0C447C] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0a3a6b]"
        >
          {t('cashRegister.openButton')}
        </button>

        {showOpenRegister && (
          <OpenShiftModal
            branchId={branchId}
            onClose={() => setShowOpenRegister(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col">

      {/* شريط حالة الصندوق — كان إغلاق الجلسة متاحًا فقط من صفحة الورديات المنفصلة،
          فالكاشير مضطر يترك شاشة البيع كل مرة يحتاج ينهي جلسته. الزر هنا يفتح نفس
          CloseShiftModal المستخدم هناك (لا نظام مكرر) على نفس currentShift المحمَّل أصلًا. */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <LockOpen className="h-4 w-4" />
          {t('cashRegister.openStatus')}
        </div>
        <button
          onClick={() => setShowCloseRegister(true)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:text-slate-400 dark:hover:bg-gray-800"
        >
          {t('cashRegister.closeButton')}
        </button>
      </div>

      {/* Matches pos-cloud's own POS page structure exactly: no internal
          scroll container anywhere. Both columns size to their natural
          content height (lg:items-start / lg:self-start on the cart), and
          the dashboard shell's own <main> is the single scroll container
          for the whole page — this is what pos-cloud does, and avoids the
          nested competing-scrollbox bugs the fixed-height version had. */}
      <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-start">

        {/* Items Grid */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ItemGrid
            onAddItem={(item, variant) => {
              addItem(item, variant)
            }}
            onOpenHeldOrders={() => setShowHeldOrders(true)}
            heldOrdersCount={heldOrders.length}
          />
        </div>

        {/* Cart Panel */}
        <div className="flex w-full shrink-0 flex-col rounded-2xl border border-posCloud-border bg-posCloud-surface p-5 dark:border-posCloudDark-border dark:bg-posCloudDark-surface lg:w-[340px] lg:self-start">
          <CartPanel
            cart={cart}
            onUpdateQty={updateQty}
            onRemoveItem={removeItem}
            onApplyCoupon={applyCoupon}
            onClearCoupon={clearCoupon}
            onCheckout={handleCheckoutClick}
            onClear={() => { clearCart(); resetGiftCardAndLoyalty(); resetNotes() }}
            onHold={handleHold}
            isHolding={holdOrderMutation.isPending}
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

      {showHeldOrders && (
        <HeldOrdersModal
          branchId={branchId}
          onClose={() => setShowHeldOrders(false)}
          onResume={handleResumeHeldOrder}
        />
      )}

      {showCloseRegister && currentShift && (
        <CloseShiftModal
          shift={currentShift}
          onClose={() => setShowCloseRegister(false)}
        />
      )}
    </div>
  )
}