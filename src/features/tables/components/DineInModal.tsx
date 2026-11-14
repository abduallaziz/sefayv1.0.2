'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus, Minus, ShoppingCart, Trash2, Pencil } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { NumberInput } from '@/shared/ui/number-input/NumberInput'
import { DialogShell } from './DialogShell'
import { CreateTableModal } from './CreateTableModal'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { ItemGrid } from '@/features/pos/components/ItemGrid'
import type { POSItem, POSVariant } from '@/features/pos/types/pos.types'
import type { RestaurantTable } from '../api/tables.api'
import { useOpenTable, useCurrentOrder, useAddDineInItems, useRemoveDineInItem, useCheckoutTable, useReleaseTable, useDeleteTable } from '../hooks/useTables'

interface Props {
  table: RestaurantTable
  onClose: () => void
}

export function DineInModal({ table, onClose }: Props) {
  const t = useTranslations('tables')
  const currency = useCurrencyDisplay()
  const [view, setView] = useState<'order' | 'addItems' | 'checkout'>('order')
  const [pendingItems, setPendingItems] = useState<{ item: POSItem; variant?: POSVariant; quantity: number }[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [cashTendered, setCashTendered] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDeleteTable, setConfirmDeleteTable] = useState(false)
  // synchronous lock: a double click must never send a second checkout (B-13)
  const checkoutLock = useRef(false)

  const { mutate: deleteTable, isPending: deletingTable } = useDeleteTable()
  const { mutate: openTable, isPending: opening } = useOpenTable()
  const { data: order, isLoading: orderLoading } = useCurrentOrder(table.status === 'occupied' ? table.id : null)
  const { mutate: addItems, isPending: addingItems } = useAddDineInItems(table.id)
  const { mutate: removeItem, isPending: removingItem } = useRemoveDineInItem(table.id)
  const { mutate: checkout, isPending: checkingOut } = useCheckoutTable(table.id)
  const { mutate: release, isPending: releasing } = useReleaseTable(table.id)

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleOpen = () => {
    setError(null)
    openTable(table.id, { onError: (e: unknown) => setError(e instanceof ApiError ? e.message : t('error')) })
  }

  const changePendingQty = (index: number, delta: number) => {
    setPendingItems((prev) =>
      prev.flatMap((p, i) => {
        if (i !== index) return [p]
        const q = Math.min(999, p.quantity + delta)
        return q <= 0 ? [] : [{ ...p, quantity: q }]
      }),
    )
  }

  const handleDeleteTable = () => {
    setError(null)
    deleteTable(table.id, {
      onSuccess: () => { setConfirmDeleteTable(false); onClose() },
      onError: (e: unknown) => { setConfirmDeleteTable(false); setError(e instanceof ApiError ? e.message : t('error')) },
    })
  }

  const handleAddToPending = (item: POSItem, variant?: POSVariant) => {
    setPendingItems((prev) => {
      const idx = prev.findIndex((p) => p.item.id === item.id && p.variant?.id === variant?.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: Math.min(999, next[idx].quantity + 1) }
        return next
      }
      return [...prev, { item, variant, quantity: 1 }]
    })
  }

  const handleSubmitItems = () => {
    if (pendingItems.length === 0) {
      setView('order')
      return
    }
    setError(null)
    addItems(
      pendingItems.map((p) => ({
        item_id: p.item.id,
        item_name: p.item.name_ar,
        variant_id: p.variant?.id,
        variant_name: p.variant?.name,
        quantity: p.quantity,
        unit_price: p.item.price + (p.variant?.price_adjustment ?? 0),
      })),
      {
        onSuccess: () => {
          setPendingItems([])
          setView('order')
        },
        onError: (e: unknown) => setError(e instanceof ApiError ? e.message : t('error')),
      },
    )
  }

  const handleRelease = () => {
    setError(null)
    release(undefined, {
      onSuccess: () => onClose(),
      onError: (e: unknown) => setError(e instanceof ApiError ? e.message : t('error')),
    })
  }

  const handleCheckout = () => {
    if (checkoutLock.current || checkingOut) return
    checkoutLock.current = true
    setError(null)
    checkout(
      {
        payment_method: paymentMethod,
        cash_tendered: paymentMethod === 'cash' ? parseFloat(cashTendered) : undefined,
      },
      {
        onSuccess: (res) => {
          toast.success(res.invoice_no ? t('paidWithInvoice', { no: res.invoice_no }) : t('paid'))
          onClose()
        },
        onError: (e: unknown) => {
          checkoutLock.current = false
          setError(e instanceof ApiError ? e.message : t('error'))
        },
      },
    )
  }

  const tendered = parseFloat(cashTendered)

  return (
    <>
    <DialogShell title={`${t('table')} ${table.name}`} onClose={onClose} busy={checkingOut || releasing || addingItems} maxWidth="max-w-2xl">
        <div className="flex-1 overflow-y-auto p-5">
          {table.status === 'available' ? (
            <div className="text-center py-10">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('tableAvailable')}</p>
              <button
                onClick={handleOpen}
                disabled={opening}
                className="px-6 py-3 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-xl font-bold"
              >
                {opening ? t('opening') : t('openTable')}
              </button>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {t('editTable')}
                </button>
                <button
                  onClick={() => setConfirmDeleteTable(true)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 rounded-lg text-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('deleteTable')}
                </button>
              </div>
            </div>
          ) : view === 'addItems' ? (
            <div className="space-y-3">
              <div className="h-[50vh]">
                <ItemGrid onAddItem={handleAddToPending} />
              </div>
              {pendingItems.length > 0 && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {pendingItems.map((p, idx) => (
                    <div key={`${p.item.id}-${p.variant?.id ?? ''}`} className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="text-sm text-gray-800 dark:text-white truncate">
                        {p.item.name_ar}{p.variant ? ` (${p.variant.name})` : ''}
                      </span>
                      <div className="flex items-center gap-1 shrink-0" dir="ltr">
                        <button
                          type="button"
                          onClick={() => changePendingQty(idx, -1)}
                          aria-label={t('decrease')}
                          title={t('decrease')}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                        >
                          {p.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{p.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changePendingQty(idx, 1)}
                          aria-label={t('increase')}
                          title={t('increase')}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {orderLoading ? (
                <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ) : (
                <>
                  {(order?.items ?? []).map((i) => (
                    <div key={i.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-sm text-gray-800 dark:text-white">{i.item_name} {i.variant_name ? `(${i.variant_name})` : ''} × {i.qty}</p>
                        {i.kitchen_status && (
                          <span className="text-xs text-gray-400">{t(`kitchenStatus.${i.kitchen_status}`)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{fmt(i.total_price)} {currency}</span>
                        {view === 'order' && (
                          <button
                            onClick={() => setRemoveTarget({ id: i.id, name: i.item_name })}
                            disabled={removingItem}
                            aria-label={t('removeItem')}
                            title={t('removeItem')}
                            className="text-gray-400 hover:text-red-500 disabled:opacity-50 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(order?.items ?? []).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">{t('noItemsYet')}</p>
                  )}
                  {(order?.items ?? []).length > 0 && (
                    <div className="space-y-1 pt-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex justify-between"><span>{t('subtotal')}</span><span>{fmt(order?.subtotal ?? 0)} {currency}</span></div>
                      {(order?.discount ?? 0) > 0 && (
                        <div className="flex justify-between"><span>{t('discount')}</span><span>-{fmt(order?.discount ?? 0)} {currency}</span></div>
                      )}
                      <div className="flex justify-between"><span>{t('tax')}</span><span>{fmt(order?.tax ?? 0)} {currency}</span></div>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 text-base font-bold text-gray-900 dark:text-white">
                    <span>{t('total')}</span>
                    <span>{fmt(order?.total ?? 0)} {currency}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {view === 'checkout' && table.status === 'occupied' && (
            <div className="mt-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-2 gap-2">
                {(['cash', 'card'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2.5 rounded-xl border text-sm font-medium ${
                      paymentMethod === m
                        ? 'border-[#0C447C] bg-[#0C447C]/10 text-[#0C447C] dark:text-[#5B9BD5]'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {t(`payment.${m}`)}
                  </button>
                ))}
              </div>
              {paymentMethod === 'cash' && (
                <>
                  <NumberInput
                    value={cashTendered}
                    onChange={setCashTendered}
                    maxLength={9}
                    placeholder={fmt(order?.total ?? 0)}
                    aria-label={t('cashTendered')}
                    className="w-full text-center h-11 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg"
                  />
                  {tendered > (order?.total ?? 0) && (
                    <div className="flex justify-between text-sm font-bold text-emerald-600">
                      <span>{t('changeDue')}</span>
                      <span>{fmt(tendered - (order?.total ?? 0))} {currency}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </div>

        {table.status === 'occupied' && (
          <div className="flex gap-3 p-5 pt-0">
            {view === 'order' && (
              <>
                {(order?.items ?? []).length === 0 && !orderLoading && (
                  <button
                    onClick={handleRelease}
                    disabled={releasing}
                    className="flex-1 py-2.5 border border-red-200 dark:border-red-900 text-red-600 disabled:opacity-50 rounded-lg text-sm font-medium"
                  >
                    {releasing ? t('processing') : t('releaseTable')}
                  </button>
                )}
                <button
                  onClick={() => setView('addItems')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  {t('addItems')}
                </button>
                <button
                  onClick={() => setView('checkout')}
                  disabled={(order?.total ?? 0) <= 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                  {t('checkout')}
                </button>
              </>
            )}
            {view === 'addItems' && (
              <>
                <button
                  onClick={() => { setPendingItems([]); setView('order') }}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSubmitItems}
                  disabled={addingItems}
                  className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {addingItems ? t('saving') : t('addItemsCount', { count: pendingItems.length })}
                </button>
              </>
            )}
            {view === 'checkout' && (
              <>
                <button
                  onClick={() => setView('order')}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut || (paymentMethod === 'cash' && (!cashTendered || !(tendered >= (order?.total ?? 0))))}
                  className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                  {checkingOut ? t('processing') : t('confirmCheckout')}
                </button>
              </>
            )}
          </div>
        )}
    </DialogShell>
    <ConfirmDialog
      open={!!removeTarget}
      onClose={() => setRemoveTarget(null)}
      onConfirm={() => {
        if (!removeTarget) return
        const id = removeTarget.id
        setError(null)
        removeItem(id, {
          onSettled: () => setRemoveTarget(null),
          onError: (e: unknown) => setError(e instanceof ApiError ? e.message : t('error')),
        })
      }}
      isLoading={removingItem}
      title={t('removeItemTitle')}
      message={t('removeItemConfirm', { name: removeTarget?.name ?? '' })}
      confirmLabel={t('remove')}
      cancelLabel={t('cancel')}
    />
    <ConfirmDialog
      open={confirmDeleteTable}
      onClose={() => setConfirmDeleteTable(false)}
      onConfirm={handleDeleteTable}
      isLoading={deletingTable}
      title={t('deleteTableTitle')}
      message={t('deleteTableConfirm', { name: table.name })}
      confirmLabel={t('remove')}
      cancelLabel={t('cancel')}
    />
    {showEdit && <CreateTableModal branchId={table.branch_id} table={table} onClose={() => setShowEdit(false)} />}
    </>
  )
}
