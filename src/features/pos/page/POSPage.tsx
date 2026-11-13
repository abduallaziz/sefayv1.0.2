'use client'

import { useRef, useState } from 'react'
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
import { useActiveNotePresets } from '@/features/note-presets/hooks/useNotePresets'
import { useCustomerRewards } from '@/features/rewards/hooks/useRewards'
import type { ReceiptLineItem } from '@/features/orders/types/order.types'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useBranches } from '@/shared/hooks/useBranches'
import { useBranchContext } from '@/core/branch/useBranchContext'
import { useCurrentShift } from '@/features/shifts/hooks/useShifts'
import { apiClient, ApiError } from '@/lib/api'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import type { Customer, CustomerCapture } from '@/features/customers/types/customer.types'
import { useUsers } from '@/features/users/hooks/useUsers'
import { OpenShiftModal } from '@/features/shifts/components/OpenShiftModal'
import { CloseShiftModal } from '@/features/shifts/components/CloseShiftModal'
import { Lock, LockOpen, Building2, AlertTriangle } from 'lucide-react'

export function POSPage() {
  const { user } = useAuthStore()
  const t = useTranslations('pos')
  const [showPayment, setShowPayment] = useState(false)
  const [receipt, setReceipt] = useState<{
    payment: PaymentData; invoiceNumber: string; orderId: string; taxRate: number; total: number
    // Authoritative breakdown from the order response — the receipt must
    // never fall back to the live `cart` preview for these, since it can
    // diverge from what was actually charged (see invoices.service.ts
    // create()'s receipt_items/subtotal/discount_amount/tax fields).
    subtotal: number; discountAmount: number; taxAmount: number; items: ReceiptLineItem[]
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  // M187 idempotency: one id per checkout attempt — reused across a
  // double-click/retry of the SAME attempt (openPayment only generates a
  // new one when none is pending), reset only after a successful order so
  // the next sale gets a fresh id.
  const saleAttemptIdRef = useRef<string | null>(null)
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  // T12 - phone/plate/size sent with the sale; the server finds or creates the
  // customer and the car when the sale is confirmed (never twice).
  const [customerCapture, setCustomerCapture] = useState<CustomerCapture | undefined>()
  const [showHeldOrders, setShowHeldOrders] = useState(false)
  const [showOpenRegister, setShowOpenRegister] = useState(false)
  const [showCloseRegister, setShowCloseRegister] = useState(false)

  // Loyalty-points state lives here (not in CartPanel or PaymentModal) so the
  // same real, server-validated selection is shared by both the cart panel's
  // preview row and the payment modal's confirm step — never two independent copies.
  const [redeemPoints, setRedeemPoints] = useState('')

  // Reward-instance redemption — same shared-state pattern as loyalty points
  // above. Never conflicts with it; both can ride on the same invoice per
  // invoices.service.ts (rewardDiscountAmount and loyaltyDiscountAmount are
  // combined independently there).
  const [selectedRewardIds, setSelectedRewardIds] = useState<string[]>([])
  const toggleReward = (id: string) => {
    setSelectedRewardIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))
  }
  const resetRewards = () => setSelectedRewardIds([])

  // Order notes: either preset selections or one free-text note, joined into the
  // single real `Order.notes` string at checkout — the contract itself never changes.
  const [noteTab, setNoteTab] = useState<'list' | 'custom'>('list')
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([])
  const [customNote, setCustomNote] = useState('')
  const { data: notePresets = [] } = useActiveNotePresets()

  const { data: branches, isLoading: branchesLoading } = useBranches()

  const { data: currentShift, isLoading: shiftLoading, isError: shiftError, refetch: refetchShift } = useCurrentShift()

  const { data: posConfig, isLoading: posConfigLoading, isError: posConfigError } = useQuery({
    queryKey: ['tenant', 'pos-config'],
    queryFn: () => apiClient.get<{ tax_rate?: number | null; tax_inclusive_pricing?: boolean; customer_capture_enabled?: boolean; loyalty_enabled?: boolean; loyalty_redemption_value?: number; enabled_payment_methods?: string[] }>('/tenant/pos-config'),
    enabled: !!user,
  })

  // tenants.tax_rate (GET /tenant/pos-config) is the sole authoritative
  // source for the cart preview's tax — the same source the server itself
  // reads at checkout via TenantsRepository.getTaxRate() (invoices.service.ts).
  // 0 is a real, legitimate configured rate (VAT-exempt tenant) and must be
  // honored, not treated as "missing" — only `null`/`undefined` (config
  // still loading, failed to load, or genuinely never configured) counts as
  // missing. There is deliberately no invented fallback (no 15%, no 0) for
  // that missing case: the guard below blocks the sale screen instead of
  // ever computing a tax preview from an assumed rate. The actual charge is
  // always safe regardless (the server re-reads this same source at
  // checkout and is authoritative for order.total), but the preview must
  // never silently show a number that isn't real.
  const hasConfiguredTaxRate = typeof posConfig?.tax_rate === 'number'
  const taxRate = hasConfiguredTaxRate ? (posConfig!.tax_rate as number) : 0
  // Determines whether item prices are interpreted as net (exclusive) or
  // gross/already-including-VAT (inclusive) — tenants.tax_inclusive_pricing
  // is the sole Source of Truth, same field the server reads at checkout
  // (TenantsRepository.getTaxConfig()). Defaults to false (exclusive),
  // matching every existing tenant's unchanged behavior.
  const taxInclusive = posConfig?.tax_inclusive_pricing ?? false
  const customerCaptureEnabled = posConfig?.customer_capture_enabled ?? false
  const loyaltyEnabled = posConfig?.loyalty_enabled ?? true
  // T11 - payment methods the owner left switched on (cash always allowed).
  const enabledPaymentMethods = posConfig?.enabled_payment_methods

  const { cart, addItem, removeItem, updateQty, setWorker, applyCoupon, clearCoupon, clearCart, loadItems } = useCart(taxRate, taxInclusive)

  // G4 - active users offered as the worker of a cart line. A role without
  // access to the users list simply gets no picker (the sale works without it).
  const { data: usersList } = useUsers()
  const workers = (usersList ?? []).filter((u) => u.is_active).map((u) => ({ id: u.id, name: u.name }))

  // The branch the user actually selected (shared branch context), not just
  // the newest branch in the list.
  const { currentBranchId } = useBranchContext()
  const branchId = currentBranchId ?? ''

  const { data: heldOrders = [] } = useHeldOrders(branchId)
  const holdOrderMutation = useHoldOrder(branchId)
  const cancelHeldOrderMutation = useCancelHeldOrder(branchId)

  const availablePoints = loyaltyEnabled ? (selectedCustomer?.loyalty_points ?? 0) : 0

  const { data: availableRewards = [] } = useCustomerRewards(selectedCustomer?.id || undefined, 'unlocked')
  const resetLoyalty = () => {
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
        sale_attempt_id: saleAttemptIdRef.current!,
        customer_id: selectedCustomer?.id || undefined,
        customer_capture: customerCapture,
        payment_method: data.method,
        cash_tendered: data.method === 'cash' ? data.cash_tendered : undefined,
        cash_amount: data.method === 'split' ? data.split_cash : undefined,
        card_amount: data.method === 'split' ? data.split_card : undefined,
        redeem_points: data.redeem_points,
        redeem_reward_instance_ids: data.redeem_reward_instance_ids,
        free_item_choices: data.free_item_choices,
        free_item_variants: data.free_item_variants,
        coupon_code: cart.coupon_code,
        notes: finalNotes || undefined,
        items: cart.items.map(item => ({
          item_id: item.item_id,
          item_name: item.name,
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          worker_id: item.worker_id,
        })),
      })
      saleAttemptIdRef.current = null
      setShowPayment(false)
      setReceipt({
        payment: data,
        invoiceNumber: order.invoice_no ?? order.id.slice(-6).toUpperCase(),
        orderId: order.id,
        taxRate: order.tax_rate ?? taxRate,
        // الإجمالي الحقيقي المُحصَّل فعليًا من السيرفر — وليس تقدير الواجهة (cart.total) —
        // يُعرَض بالإيصال، احتياطًا لأي فارق نادر بين لحظة معاينة الكوبون/الحساب وقت
        // الدفع الفعلي (مثلًا كوبون استُنفد بواسطة كاشير آخر بين المعاينة والتأكيد).
        total: order.total,
        // Same reasoning as `total` above, extended to the full breakdown —
        // the receipt must reconcile against what the server actually
        // charged, not the client's last cart preview.
        subtotal: order.subtotal,
        discountAmount: order.discount_amount ?? 0,
        taxAmount: order.tax,
        items: order.receipt_items ?? [],
      })
      // البيع نجح دائمًا حتى لو فشل خصم المخزون (best-effort عمدًا — راجع
      // invoices.service.ts create()) — كان الفشل ده يتسجل في سجلات السيرفر
      // بس ومحدش يشوفه. لازم يظهر للكاشير بدل ما يفضل مدفون.
      if (order.stock_warning) {
        toast.warning(t('payment.stockWarning'))
      }
    } catch (error: unknown) {
      // كان يُسجَّل بـconsole فقط بلا أي إشعار للكاشير — يظهر كأن الزر "لا يعمل" بصمت
      // عند فشل حقيقي (كوبون غير صالح لحظة التأكيد، رصيد بطاقة هدايا غير كافٍ، إلخ).
      // رسالة "لا توجد جلسة صندوق نشطة" من الباك-إند نص تقني (بادئة NO_ACTIVE_CASH_SESSION)
      // لا يجب أن يظهر للكاشير كما هو — تُصنَّف هنا وتُستبدَل برسالة عمل واضحة.
      const rawMessage: string = error instanceof ApiError ? error.message : ''
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
    if (!saleAttemptIdRef.current) {
      saleAttemptIdRef.current = crypto.randomUUID()
    }
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
    setCustomerCapture(undefined)
    resetLoyalty()
    resetRewards()
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
          setSelectedCustomer(null); setCustomerCapture(undefined)
          resetLoyalty()
          resetRewards()
          resetNotes()
        },
        onError: (error: unknown) => {
          toast.error(error instanceof ApiError ? error.message : t('heldOrders.holdFailed'))
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
    } catch (error: unknown) {
      toast.error(error instanceof ApiError ? error.message : t('heldOrders.resumeFailed'))
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

  // POS must never submit branch_id: '' — useBranches() only returns active
  // branches, so an empty list (or user.branchId pointing at nothing) means
  // there is genuinely no active branch to sell against. The backend's own
  // @IsUUID() validation would reject '' anyway, but by then the cashier has
  // already tried to pay — this blocks the whole POS screen up front instead,
  // same pattern as the closed-cash-register guard below. No fallback branch
  // is fabricated here on purpose (no "first branch regardless of active
  // state", no auto-assigning Main Branch) — if there's no active branch,
  // there is nothing correct to sell against.
  if (!branchesLoading && !branchId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800">
          <Building2 className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {t('noActiveBranch.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('noActiveBranch.subtitle')}
          </p>
        </div>
      </div>
    )
  }

  // البيع ممنوع كليًا بلا جلسة صندوق مفتوحة (نفس القاعدة المفروضة في الباك-إند
  // عبر ShiftsService.assertOpenSession) — الواجهة تعكسها بإخفاء شاشة البيع
  // بالكامل بدل الاعتماد فقط على رفض السيرفر لطلب الدفع. لا نعرض شيئًا أثناء
  // التحميل الأول لتفادي "ومضة" شاشة الإغلاق قبل وصول حالة الجلسة الحقيقية.
  // A failed status check (e.g. rate limit) is NOT "register closed": say so and
  // let the cashier retry, instead of showing the misleading closed screen.
  if (!shiftLoading && !currentShift && shiftError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800">
          <Lock className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {t('cashRegister.checkFailedTitle')}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('cashRegister.checkFailedSubtitle')}
          </p>
        </div>
        <button
          onClick={() => refetchShift()}
          className="mt-2 rounded-lg bg-[#0C447C] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0a3a6b]"
        >
          {t('cashRegister.retryButton')}
        </button>
      </div>
    )
  }

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

  // The open register belongs to ANOTHER branch than the one selected now: the server refuses every
  // sale in that state, so say it plainly (and offer to close it) instead of showing "register open".
  if (currentShift && branchId && currentShift.branch_id !== branchId) {
    const shiftBranch = branches?.find((b) => b.id === currentShift.branch_id)?.name
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
          <Lock className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('cashRegister.otherBranchTitle')}</h2>
          <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {t('cashRegister.otherBranchSubtitle', { branch: shiftBranch ?? '' })}
          </p>
        </div>
        <button
          onClick={() => setShowCloseRegister(true)}
          className="mt-2 rounded-lg bg-[#0C447C] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0a3a6b]"
        >
          {t('cashRegister.closeButton')}
        </button>
        {showCloseRegister && (
          <CloseShiftModal shift={currentShift} onClose={() => setShowCloseRegister(false)} />
        )}
      </div>
    )
  }

  // Same guard pattern as the branch/register checks above: block the whole
  // sale screen rather than ever computing a cart preview from an assumed
  // tax rate. Checked after those two guards (a closed register or missing
  // branch is reported first, since either already prevents a sale). No
  // render during the initial config load either, to avoid a flash of this
  // error before the real config arrives — same reasoning as shiftLoading.
  if (!posConfigLoading && (posConfigError || !hasConfiguredTaxRate)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800">
          <AlertTriangle className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {t('taxConfig.unavailableTitle')}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('taxConfig.unavailableSubtitle')}
          </p>
        </div>
      </div>
    )
  }

  if (posConfigLoading) {
    return null
  }

  return (
    <div className="flex flex-col">

      {/* شريط حالة الصندوق — كان إغلاق الجلسة متاحًا فقط من صفحة الورديات المنفصلة،
          فالكاشير مضطر يترك شاشة البيع كل مرة يحتاج ينهي جلسته. الزر هنا يفتح نفس
          CloseShiftModal المستخدم هناك (لا نظام مكرر) على نفس currentShift المحمَّل أصلًا. */}
      <div className="flex items-center justify-between gap-3 px-4 pt-3 sm:px-6">
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
      <div className="p-4 sm:px-6 sm:pb-6 sm:pt-3">
        {/* The scan bar, search/actions row and categories span the full page
            width; the cart is passed in as `aside` and starts BELOW them,
            next to the product grid only (on desktop). */}
        <ItemGrid
          onAddItem={(item, variant) => {
            addItem(item, variant)
          }}
          onOpenHeldOrders={() => setShowHeldOrders(true)}
          heldOrdersCount={heldOrders.length}
          aside={
        <div className="flex w-[clamp(168px,36%,360px)] shrink-0 flex-col rounded-2xl border border-posCloud-border bg-posCloud-surface p-2.5 dark:border-posCloudDark-border dark:bg-posCloudDark-surface order-first rtl:order-last self-start sticky top-4 min-h-[26rem] max-h-[calc(100vh-24rem)] min-[480px]:w-[clamp(230px,38%,400px)] min-[480px]:max-h-[calc(100vh-19rem)] min-[480px]:p-4">
          <CartPanel
            cart={cart}
            onUpdateQty={updateQty}
            onRemoveItem={removeItem}
            workers={workers}
            onSetWorker={setWorker}
            onApplyCoupon={applyCoupon}
            onClearCoupon={clearCoupon}
            onCheckout={handleCheckoutClick}
            onClear={() => { clearCart(); resetLoyalty(); resetRewards(); resetNotes() }}
            onHold={handleHold}
            isHolding={holdOrderMutation.isPending}
            customerCaptureEnabled={customerCaptureEnabled}
            selectedCustomer={selectedCustomer}
            onClearCustomer={() => { setSelectedCustomer(null); setCustomerCapture(undefined); resetRewards() }}
            notePresets={notePresets}
            noteTab={noteTab}
            onNoteTabChange={setNoteTab}
            selectedPresetIds={selectedPresetIds}
            onTogglePreset={togglePreset}
            customNote={customNote}
            onCustomNoteChange={setCustomNote}
          />
        </div>
          }
        />
      </div>

      {showPayment && (
        <PaymentModal
          cart={cart}
          customer={selectedCustomer}
          enabledMethods={enabledPaymentMethods}
          redemptionValue={posConfig?.loyalty_redemption_value ?? 0.01}
          onConfirm={handleConfirmPayment}
          onClose={() => { setShowPayment(false); setPaymentError(null) }}
          isSubmitting={isSubmitting}
          error={paymentError}
          availablePoints={availablePoints}
          redeemPoints={redeemPoints}
          onRedeemPointsChange={setRedeemPoints}
          availableRewards={availableRewards}
          selectedRewardIds={selectedRewardIds}
          onToggleReward={toggleReward}
        />
      )}

      {showCustomerPicker && (
        <CustomerPickerModal
          onSelect={(customer, capture) => {
            setSelectedCustomer(customer)
            setCustomerCapture(capture)
            resetRewards()
            setShowCustomerPicker(false)
            openPayment()
          }}
          onClose={() => setShowCustomerPicker(false)}
        />
      )}

      {receipt && (
        <ReceiptModal
          items={receipt.items}
          subtotal={receipt.subtotal}
          discountAmount={receipt.discountAmount}
          taxAmount={receipt.taxAmount}
          couponCode={cart.coupon_code}
          taxInclusive={cart.tax_inclusive}
          payment={receipt.payment}
          invoiceNumber={receipt.invoiceNumber}
          orderId={receipt.orderId}
          taxRate={receipt.taxRate}
          total={receipt.total}
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