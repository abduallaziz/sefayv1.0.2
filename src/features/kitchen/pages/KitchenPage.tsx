'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { ChefHat, ArrowRight } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/core/auth/stores/auth.store'
import { useKitchenOrders, useUpdateKitchenItemStatus } from '../hooks/useKitchen'
import type { KitchenItem } from '../api/kitchen.api'

const COLUMNS = ['pending', 'preparing', 'ready'] as const
const NEXT_STATUS: Record<string, string> = { pending: 'preparing', preparing: 'ready', ready: 'served' }

const COLUMN_COLORS: Record<string, string> = {
  pending: 'border-amber-300 dark:border-amber-500/30',
  preparing: 'border-blue-300 dark:border-blue-500/30',
  ready: 'border-emerald-300 dark:border-emerald-500/30',
}

export function KitchenPage() {
  const t = useTranslations('kitchen')
  const { user } = useAuthStore()

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.get('/branches') as any,
    enabled: !!user,
  })
  const branchId = user?.branchId ?? (branches as any)?.[0]?.id ?? ''

  const { data: orders = [], isLoading } = useKitchenOrders(branchId)
  const { mutate: updateStatus } = useUpdateKitchenItemStatus()

  const itemsByStatus: Record<string, { item: KitchenItem; tableName: string | null; orderTime: string }[]> = {
    pending: [], preparing: [], ready: [],
  }

  for (const order of orders) {
    for (const item of order.items) {
      if (itemsByStatus[item.kitchen_status]) {
        itemsByStatus[item.kitchen_status].push({ item, tableName: order.table_name, orderTime: order.created_at })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ChefHat className="w-5 h-5 text-gray-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COLUMNS.map((status) => (
            <div key={status} className={`bg-white dark:bg-gray-800 border-2 rounded-xl p-4 ${COLUMN_COLORS[status]}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t(`status.${status}`)}</h2>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  {itemsByStatus[status].length}
                </span>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {itemsByStatus[status].length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">{t('empty')}</p>
                ) : (
                  itemsByStatus[status].map(({ item, tableName }) => (
                    <div key={item.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">{tableName ?? t('noTable')}</span>
                        <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{item.item_name} × {item.qty}</p>
                      <button
                        onClick={() => updateStatus({ itemId: item.id, status: NEXT_STATUS[status] })}
                        className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-xs font-medium"
                      >
                        {t(`advanceTo.${NEXT_STATUS[status]}`)}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
