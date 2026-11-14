'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { Plus, Gift, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { EmptyState } from '@/shared/ui/empty-state'
import { useRewardDefinitions, useUpdateRewardDefinition, useDeleteRewardDefinition } from '../hooks/useRewards'
import { RewardFormModal } from '../components/RewardFormModal'
import type { RewardDefinition } from '../api/rewards.api'

export function RewardsPage() {
  const t = useTranslations('rewards')
  const { data: rewards = [], isLoading } = useRewardDefinitions()
  const { mutate: updateReward } = useUpdateRewardDefinition()
  const { mutate: deleteReward } = useDeleteRewardDefinition()

  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<RewardDefinition | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RewardDefinition | null>(null)

  const openCreate = () => { setSelected(null); setFormOpen(true) }
  const openEdit = (r: RewardDefinition) => { setSelected(r); setFormOpen(true) }
  const toggleActive = (r: RewardDefinition) => updateReward({ id: r.id, data: { is_active: !r.is_active } })
  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteReward(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('newReward')}
        </button>
      </div>

      {isLoading ? (
        <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      ) : rewards.length === 0 ? (
        <EmptyState
          icon={Gift}
          title={t('noRewards')}
          description={t('noRewardsHint')}
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('newReward')}
            </button>
          }
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {rewards.map((r) => (
              <div key={r.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{r.name}</p>
                    <p className="text-xs text-gray-500">{t(`trigger.${r.trigger_type}`)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" aria-label={t('editReward')} title={t('editReward')} onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><Edit className="w-3.5 h-3.5" /></button>
                    <button type="button" aria-label={t('deleteReward')} title={t('deleteReward')} onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-500">{t(`rewardTypeOptions.${r.reward_type}`)}</span>
                  <button
                    onClick={() => toggleActive(r)}
                    className={`flex items-center gap-1 text-xs font-medium ${r.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}
                  >
                    {r.is_active ? <><ToggleRight className="w-4 h-4" />{t('active')}</> : <><ToggleLeft className="w-4 h-4" />{t('inactive')}</>}
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
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('name')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('triggerType')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('rewardType')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('branchScope')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500">{t('expirationDays')}</th>
                  <th className="text-start px-3 py-3 font-medium text-gray-500 w-20">{t('status')}</th>
                  <th className="px-3 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rewards.map((r, i) => (
                  <tr key={r.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/40 dark:bg-gray-800/10' : ''}`}>
                    <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">{r.name}</td>
                    <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{t(`trigger.${r.trigger_type}`)}</td>
                    <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{t(`rewardTypeOptions.${r.reward_type}`)}</td>
                    <td className="px-3 py-3 text-gray-500">{t(`branchScopeOptions.${r.branch_scope}`)}</td>
                    <td className="px-3 py-3 text-gray-500">{r.expiration_days ?? t('noExpiry')}</td>
                    <td className="px-3 py-3 w-20">
                      <button
                        onClick={() => toggleActive(r)}
                        className={`flex items-center gap-1 text-xs font-medium ${r.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}
                      >
                        {r.is_active ? <><ToggleRight className="w-4 h-4" /><span>{t('active')}</span></> : <><ToggleLeft className="w-4 h-4" /><span>{t('inactive')}</span></>}
                      </button>
                    </td>
                    <td className="px-3 py-3 w-16">
                      <div className="flex items-center gap-1">
                        <button type="button" aria-label={t('editReward')} title={t('editReward')} onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-white"><Edit className="w-3.5 h-3.5" /></button>
                        <button type="button" aria-label={t('deleteReward')} title={t('deleteReward')} onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {formOpen && (
        <RewardFormModal reward={selected} onClose={() => { setFormOpen(false); setSelected(null) }} />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title={t('deleteReward')}
        message={t('deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </div>
  )
}
