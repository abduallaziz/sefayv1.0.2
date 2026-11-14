'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCreateTable, useUpdateTable } from '../hooks/useTables'
import { ApiError } from '@/lib/api'
import { parseIntStrict } from '@/lib/digits'
import { NumberInput } from '@/shared/ui/number-input/NumberInput'
import { DialogShell } from './DialogShell'
import type { RestaurantTable } from '../api/tables.api'

export const MAX_CAPACITY = 1000

interface Props {
  branchId: string
  /** When set the dialog edits this table instead of creating one. */
  table?: RestaurantTable
  onClose: () => void
}

export function CreateTableModal({ branchId, table, onClose }: Props) {
  const t = useTranslations('tables')
  const { mutate: createTable, isPending: creating } = useCreateTable()
  const { mutate: updateTable, isPending: updating } = useUpdateTable()
  const isPending = creating || updating
  const [name, setName] = useState(table?.name ?? '')
  const [capacity, setCapacity] = useState(String(table?.capacity ?? 4))
  const [error, setError] = useState<string | null>(null)

  const cap = parseIntStrict(capacity)
  const capacityValid = cap !== null && cap >= 1 && cap <= MAX_CAPACITY
  const showCapacityError = capacity !== '' && !capacityValid

  const handleSubmit = () => {
    if (isPending || !name.trim() || !capacityValid) return
    setError(null)
    const done = {
      onSuccess: () => onClose(),
      onError: (e: unknown) => setError(e instanceof ApiError ? e.message : t('error')),
    }
    if (table) updateTable({ id: table.id, data: { name: name.trim(), capacity: cap } }, done)
    else createTable({ branch_id: branchId, name: name.trim(), capacity: cap }, done)
  }

  return (
    <DialogShell title={table ? t('editTable') : t('newTable')} onClose={onClose} busy={isPending}>
      <div className="p-5">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('tableName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoFocus
              placeholder={t('tableNamePlaceholder')}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('capacity')}</label>
            <NumberInput
              allowDecimal={false}
              value={capacity}
              onChange={setCapacity}
              maxLength={4}
              aria-invalid={showCapacityError}
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
            {showCapacityError && <p className="text-xs text-red-500 mt-1">{t('capacityRange', { max: MAX_CAPACITY })}</p>}
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
            disabled={isPending || !name.trim() || !capacityValid}
            className="flex-[2] py-2.5 bg-[#0C447C] hover:bg-[#0a3a6b] disabled:opacity-50 text-white rounded-xl text-sm font-bold"
          >
            {isPending ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </DialogShell>
  )
}
