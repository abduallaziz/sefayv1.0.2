'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCreateTable } from '../hooks/useTables'

interface Props {
  branchId: string
  onClose: () => void
}

export function CreateTableModal({ branchId, onClose }: Props) {
  const t = useTranslations('tables')
  const { mutate: createTable, isPending } = useCreateTable()
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('4')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!name.trim()) return
    setError(null)
    createTable(
      { branch_id: branchId, name: name.trim(), capacity: parseInt(capacity, 10) || 2 },
      {
        onSuccess: () => onClose(),
        onError: (e: any) => setError(e?.message ?? t('error')),
      },
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[400] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 w-full max-w-sm">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">{t('newTable')}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('tableName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('tableNamePlaceholder')}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('capacity')}</label>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
            className="flex-[2] py-2.5 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-xl text-sm font-bold"
          >
            {isPending ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
