'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useTenantStore } from '@/core/tenant/stores/tenant.store'
import { ItemGrid } from '@/features/pos/components/ItemGrid'
import type { POSItem, POSVariant } from '@/features/pos/types/pos.types'
import type { RestaurantTable } from '../api/tables.api'
import { useOpenTable, useCurrentOrder, useAddDineInItems, useRemoveDineInItem, useCheckoutTable } from '../hooks/useTables'

interface Props {
  table: RestaurantTable
  onClose: () => void
}

export function DineInModal({ table, onClose }: Props) {
  const t = useTranslations('tables')
  const currency = useTenantStore((s) => s.currency_symbol)
  const [view, setView] = useState<'order' | 'addItems' | 'checkout'>('order')
  const [pendingItems, setPendingItems] = useState<{ item: POSItem; variant?: POSVariant; quantity: number }[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [cashTendered, setCashTendered] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutate: openTable, isPending: opening } = useOpenTable()
  const { data: order, isLoading: orderLoading } = useCurrentOrder(table.status === 'occupied' ? table.id : null)
  const { mutate: addItems, isPending: addingItems } = useAddDineInItems(table.id)
  const { mutate: removeItem, isPending: removingItem } = useRemoveDineInItem(table.id)
  const { mutate: checkout, isPending: checkingOut } = useCheckoutTable(table.id)

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleOpen = () => {
    setError(null)
    openTable(table.id, { onError: (e: any) => setError(e?.message ?? t('error')) })
  }

  const handleAddToPending = (item: POSItem, variant?: POSVariant) => {
    setPendingItems((prev) => {
      const idx = prev.findIndex((p) => p.item.id === item.id && p.variant?.id === variant?.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
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
        onError: (e: any) => setError(e?.message ?? t('error')),
      },
    )
  }

  const handleCheckout = () => {
    setError(null)
    checkout(
      {
        payment_method: paymentMethod,
        cash_tendered: paymentMethod === 'cash' ? parseFloat(cashTendered) : undefined,
      },
      {
        onSuccess: () => onClose(),
        onError: (e: any) => setError(e?.message ?? t('error')),
      },
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('table')} {table.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

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
            </div>
          ) : view === 'addItems' ? (
            <div className="h-[50vh]">
              <ItemGrid onAddItem={handleAddToPending} />
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
                            onClick={() => { setError(null); removeItem(i.id, { onError: (e: any) => setError(e?.message ?? t('error')) }) }}
                            disabled={removingItem}
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
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={fmt(order?.total ?? 0)}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full text-center h-11 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg"
                />
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </div>

        {table.status === 'occupied' && (
          <div className="flex gap-3 p-5 pt-0">
            {view === 'order' && (
              <>
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
                  disabled={checkingOut || (paymentMethod === 'cash' && (!cashTendered || parseFloat(cashTendered) < (order?.total ?? 0)))}
                  className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
                >
                  {checkingOut ? t('processing') : t('confirmCheckout')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
