'use client'

import { useTranslations } from 'next-intl'
import { X, Clock, Users, Lock, PlayCircle, Trash2 } from 'lucide-react'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import {
  useHeldOrders,
  useUpdateHeldOrderVisibility,
  useCancelHeldOrder,
} from '../hooks/useHeldOrders'
import type { HeldOrder } from '@/features/orders/api/orders.api'

interface Props {
  branchId: string
  onClose: () => void
  onResume: (order: HeldOrder) => void
}

export function HeldOrdersModal({ branchId, onClose, onResume }: Props) {
  const t = useTranslations('pos.heldOrders')
  const currency = useCurrencyDisplay()
  const { data: heldOrders = [], isLoading } = useHeldOrders(branchId)
  const updateVisibility = useUpdateHeldOrderVisibility(branchId)
  const cancelHeld = useCancelHeldOrder(branchId)

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-posCloud-border dark:border-posCloudDark-border shrink-0">
          <h2 className="text-lg font-semibold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('title')}</h2>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary hover:text-posCloud-text-primary dark:hover:text-posCloudDark-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {isLoading ? (
            <div className="h-16 bg-posCloud-background dark:bg-posCloudDark-background rounded-xl animate-pulse" />
          ) : heldOrders.length === 0 ? (
            <p className="text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary text-center py-8">{t('empty')}</p>
          ) : (
            heldOrders.map((order) => {
              const isAllCashiers = order.held_visibility === 'all_cashiers'
              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-posCloud-border dark:border-posCloudDark-border bg-posCloud-background dark:bg-posCloudDark-background p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-posCloud-text-primary dark:text-posCloudDark-text-primary">
                          {order.customer_name || t('noCustomer')}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
                          <Clock className="w-3 h-3" />
                          {new Date(order.held_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary mt-0.5">
                        {t('heldBy', { name: order.cashier_name ?? '—' })}
                      </p>
                      {order.notes && (
                        <p className="text-xs text-posCloud-text-secondary dark:text-posCloudDark-text-secondary mt-1 truncate">{order.notes}</p>
                      )}
                    </div>
                    <span className="shrink-0 font-bold text-posCloud-primary text-sm">
                      {order.total.toLocaleString('en-US')} {currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-posCloud-border dark:border-posCloudDark-border">
                    {/* Visibility toggle — only changeable before resuming, per spec */}
                    <button
                      onClick={() =>
                        updateVisibility.mutate({
                          id: order.id,
                          visibility: isAllCashiers ? 'self' : 'all_cashiers',
                        })
                      }
                      disabled={updateVisibility.isPending}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-posCloud-text-secondary dark:text-posCloudDark-text-secondary border border-posCloud-border dark:border-posCloudDark-border hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-60"
                    >
                      {isAllCashiers ? <Users className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {isAllCashiers ? t('visibilityAll') : t('visibilitySelf')}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => cancelHeld.mutate(order.id)}
                        disabled={cancelHeld.isPending}
                        aria-label={t('cancel')}
                        className="p-1.5 rounded-lg text-posCloud-danger hover:bg-posCloud-danger-light dark:hover:bg-posCloud-danger/15 transition-colors disabled:opacity-60"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onResume(order)}
                        className="flex items-center gap-1.5 rounded-lg bg-posCloud-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-posCloud-primary-dark transition-colors"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        {t('resume')}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
