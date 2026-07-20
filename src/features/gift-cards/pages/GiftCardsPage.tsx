'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Gift, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useCurrencyDisplay } from '@/core/tenant/stores/tenant.store'
import { formatNumber } from '@/lib/format'
import { EmptyState } from '@/shared/ui/empty-state'
import { useGiftCards, useUpdateGiftCard, useDeleteGiftCard } from '../hooks/useGiftCards'
import { IssueGiftCardModal } from '../components/IssueGiftCardModal'
import type { GiftCard } from '../api/gift-cards.api'

export function GiftCardsPage() {
  const t = useTranslations('giftCards')
  const currency = useCurrencyDisplay()
  const { data: cards = [], isLoading } = useGiftCards()
  const { mutate: updateCard } = useUpdateGiftCard()
  const { mutate: deleteCard } = useDeleteGiftCard()

  const [issueOpen, setIssueOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GiftCard | null>(null)

  const toggleActive = (c: GiftCard) => updateCard({ id: c.id, data: { is_active: !c.is_active } })
  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteCard(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => setIssueOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('issueGiftCard')}
        </button>
      </div>

      {isLoading ? (
        <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      ) : cards.length === 0 ? (
        <EmptyState
          icon={Gift}
          title={t('noGiftCards')}
          description={t('noGiftCardsHint')}
          action={
            <button
              onClick={() => setIssueOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('issueGiftCard')}
            </button>
          }
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {cards.map((c) => (
              <div key={c.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-gray-900 dark:text-white truncate">{c.code}</p>
                    <p className="text-xs text-gray-500">
                      {formatNumber(c.current_balance)} / {formatNumber(c.initial_balance)} {currency}
                    </p>
                  </div>
                  <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500">{c.expires_at ? c.expires_at.slice(0, 10) : t('noExpiry')}</span>
                  <button
                    onClick={() => toggleActive(c)}
                    className={`flex items-center gap-1 text-xs font-medium ${c.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}
                  >
                    {c.is_active ? <><ToggleRight className="w-4 h-4" />{t('active')}</> : <><ToggleLeft className="w-4 h-4" />{t('inactive')}</>}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('code')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('balance')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('expiresAt')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500 w-20">{t('status')}</th>
                  <th className="px-3 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {cards.map((c, i) => (
                  <tr key={c.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/40 dark:bg-gray-800/10' : ''}`}>
                    <td className="px-3 py-3 font-mono font-medium text-gray-900 dark:text-white">{c.code}</td>
                    <td className="px-3 py-3 text-gray-700 dark:text-gray-300">
                      {formatNumber(c.current_balance)} / {formatNumber(c.initial_balance)} {currency}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{c.expires_at ? c.expires_at.slice(0, 10) : t('noExpiry')}</td>
                    <td className="px-3 py-3 w-20">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`flex items-center gap-1 text-xs font-medium ${c.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}
                      >
                        {c.is_active ? <><ToggleRight className="w-4 h-4" /><span>{t('active')}</span></> : <><ToggleLeft className="w-4 h-4" /><span>{t('inactive')}</span></>}
                      </button>
                    </td>
                    <td className="px-3 py-3 w-16">
                      <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {issueOpen && <IssueGiftCardModal onClose={() => setIssueOpen(false)} />}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-[400] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{t('deleteGiftCard')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t('deleteConfirm', { code: deleteTarget.code })}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium">
                {t('cancel')}
              </button>
              <button onClick={confirmDelete} className="flex-[2] py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold">
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
