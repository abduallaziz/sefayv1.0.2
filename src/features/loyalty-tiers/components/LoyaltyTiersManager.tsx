'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2 } from 'lucide-react'
import {
  useLoyaltyTiers,
  useCreateLoyaltyTier,
  useDeleteLoyaltyTier,
} from '../hooks/useLoyaltyTiers'

const inputClass = 'w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:border-[#0C447C]'
const labelClass = 'text-xs text-slate-500 mb-1 block'

export function LoyaltyTiersManager() {
  const t = useTranslations('settings')
  const { data: tiers = [], isLoading } = useLoyaltyTiers()
  const createTier = useCreateLoyaltyTier()
  const deleteTier = useDeleteLoyaltyTier()

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [minPoints, setMinPoints] = useState('')
  const [multiplier, setMultiplier] = useState('1')

  const handleAdd = () => {
    if (!name.trim() || !minPoints || !multiplier) return
    createTier.mutate(
      {
        name: name.trim(),
        min_lifetime_points: parseFloat(minPoints),
        points_multiplier: parseFloat(multiplier),
        sort_order: tiers.length,
      },
      {
        onSuccess: () => {
          setName('')
          setMinPoints('')
          setMultiplier('1')
          setAdding(false)
        },
      },
    )
  }

  return (
    <div>
      {isLoading ? (
        <div className="h-16 bg-slate-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      ) : tiers.length === 0 && !adding ? (
        <p className="text-sm text-slate-500 dark:text-gray-400">{t('loyalty.noTiers')}</p>
      ) : (
        <div className="space-y-2 mb-3">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{tier.name}</p>
                <p className="text-xs text-slate-500">
                  {t('loyalty.tierThreshold', { points: tier.min_lifetime_points })} · x{tier.points_multiplier}
                </p>
              </div>
              <button
                onClick={() => deleteTier.mutate(tier.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-3 bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-700 rounded-lg">
          <div>
            <label className={labelClass}>{t('loyalty.tierName')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('loyalty.tierMinPoints')}</label>
            <input type="number" min={0} value={minPoints} onChange={(e) => setMinPoints(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('loyalty.tierMultiplier')}</label>
            <input type="number" min={0.01} step="0.1" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-3 flex gap-2">
            <button
              onClick={handleAdd}
              disabled={createTier.isPending}
              className="px-3 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {createTier.isPending ? t('saving') : t('save')}
            </button>
            <button onClick={() => setAdding(false)} className="px-3 py-2 border border-slate-200 dark:border-gray-700 text-slate-500 rounded-lg text-sm">
              {t('loyalty.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-[#0C447C] dark:text-[#5B9BD5] font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('loyalty.addTier')}
        </button>
      )}
    </div>
  )
}
